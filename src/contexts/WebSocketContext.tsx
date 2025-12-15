'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type {
  ClientMessage,
  ServerMessage,
  ConnectionState,
  WebSocketConfig,
  EventHandler,
} from '@/lib/websocket-protocol';

interface WebSocketContextValue {
  state: ConnectionState;
  userId: string | null;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  on: (event: string, handler: EventHandler) => () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  wsToken: string | null;
}

export function WebSocketProvider({ children, wsToken }: WebSocketProviderProps) {
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [userId, setUserId] = useState<string | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const pingTimer = useRef<NodeJS.Timeout | null>(null);
  const eventHandlers = useRef<Map<string, Set<EventHandler>>>(new Map());
  const subscribedTopics = useRef<Set<string>>(new Set());
  const connectRef = useRef<(() => void) | null>(null);
  const reconnectRef = useRef<(() => void) | null>(null);

  const config: WebSocketConfig = {
    url: process.env.NEXT_PUBLIC_WS_SERVER_URL || 'wss://52.12.86.103:3000',
    token: wsToken || '',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    pingInterval: 30000,
  };

  // Limpiar timers
  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  }, []);

  // Enviar mensaje al servidor
  const send = useCallback((message: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // Iniciar ping periódico
  const startPingTimer = useCallback(() => {
    clearTimers();
    pingTimer.current = setInterval(() => {
      send({ type: 'ping' });
    }, config.pingInterval);
  }, [clearTimers, send, config.pingInterval]);

  // Conectar al WebSocket
  const connect = useCallback(() => {
    if (!wsToken) {
      console.log('[WebSocket] No hay token disponible, omitiendo conexión');
      setState('disconnected');
      return;
    }

    // Limpiar conexión existente
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    try {
      setState('connecting');
      const wsUrl = `${config.url}/ws?token=${encodeURIComponent(config.token)}`;
      console.log('[WebSocket] Conectando...');
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WebSocket] Conectado exitosamente');
        setState('connected');
        reconnectAttempts.current = 0;
        startPingTimer();

        // Re-suscribir a topics previos
        subscribedTopics.current.forEach((topic) => {
          send({ type: 'subscribe', topic });
        });
      };

      ws.current.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'connected':
              setUserId(message.userId);
              console.log(`[WebSocket] Usuario conectado: ${message.userId}`);
              break;

            case 'event':
              console.log(`[WebSocket] Evento recibido: ${message.event} en topic ${message.topic}`);
              
              // Emitir a handlers registrados
              const handlers = eventHandlers.current.get(message.event);
              if (handlers) {
                handlers.forEach((handler) => {
                  try {
                    handler(message.data, message.event, message.topic);
                  } catch (err) {
                    console.error(`[WebSocket] Error en handler de evento ${message.event}:`, err);
                  }
                });
              }
              break;

            case 'pong':
              // Respuesta al ping, conexión viva
              break;

            case 'error':
              console.error(`[WebSocket] Error del servidor: ${message.message}`);
              break;

            default:
              console.warn('[WebSocket] Tipo de mensaje desconocido:', message);
          }
        } catch (err) {
          console.error('[WebSocket] Error al parsear mensaje:', err);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error de conexión:', error);
        setState('error');
      };

      ws.current.onclose = (event) => {
        console.log(`[WebSocket] Conexión cerrada (código: ${event.code})`);
        clearTimers();
        
        // Reconectar automáticamente si no fue cierre intencional
        if (event.code !== 1000 && wsToken) {
          reconnectRef.current?.();
        } else {
          setState('disconnected');
        }
      };
    } catch (error) {
      console.error('[WebSocket] Error al crear conexión:', error);
      setState('error');
      reconnectRef.current?.();
    }
  }, [wsToken, config.url, config.token, send, startPingTimer, clearTimers]);

  // Reconectar WebSocket
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= config.maxReconnectAttempts!) {
      console.error('[WebSocket] Máximo de intentos de reconexión alcanzado');
      setState('error');
      return;
    }

    setState('reconnecting');
    reconnectAttempts.current += 1;

    reconnectTimer.current = setTimeout(() => {
      console.log(`[WebSocket] Intento de reconexión ${reconnectAttempts.current}/${config.maxReconnectAttempts}`);
      connectRef.current?.();
    }, config.reconnectInterval);
  }, [config.maxReconnectAttempts, config.reconnectInterval]);

  // Actualizar refs en useEffect
  useEffect(() => {
    connectRef.current = connect;
    reconnectRef.current = reconnect;
  }, [connect, reconnect]);

  // Suscribirse a un topic
  const subscribe = useCallback((topic: string) => {
    if (subscribedTopics.current.has(topic)) {
      return; // Ya suscrito
    }

    subscribedTopics.current.add(topic);
    send({ type: 'subscribe', topic });
    console.log(`[WebSocket] Suscrito a topic: ${topic}`);
  }, [send]);

  // Desuscribirse de un topic
  const unsubscribe = useCallback((topic: string) => {
    if (!subscribedTopics.current.has(topic)) {
      return; // No estaba suscrito
    }

    subscribedTopics.current.delete(topic);
    send({ type: 'unsubscribe', topic });
    console.log(`[WebSocket] Desuscrito de topic: ${topic}`);
  }, [send]);

  // Registrar handler para un evento
  const on = useCallback((event: string, handler: EventHandler) => {
    if (!eventHandlers.current.has(event)) {
      eventHandlers.current.set(event, new Set());
    }
    eventHandlers.current.get(event)!.add(handler);

    // Retornar función de cleanup
    return () => {
      const handlers = eventHandlers.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlers.current.delete(event);
        }
      }
    };
  }, []);

  // Conectar al montar si hay token
  useEffect(() => {
    if (wsToken) {
      // Usar timeout para evitar warning de cascading renders
      const timer = setTimeout(() => connect(), 0);
      return () => clearTimeout(timer);
    }
  }, [wsToken, connect]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearTimers();
      if (ws.current) {
        send({ type: 'close' });
        ws.current.close(1000); // Cierre normal
        ws.current = null;
      }
    };
  }, [clearTimers, send]);

  const value: WebSocketContextValue = {
    state,
    userId,
    subscribe,
    unsubscribe,
    on,
    reconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext debe usarse dentro de WebSocketProvider');
  }
  return context;
}
