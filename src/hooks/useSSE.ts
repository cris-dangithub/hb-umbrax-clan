import { useEffect, useRef, useCallback, useState } from 'react';

interface SSEOptions {
  topic: string;
  onConnected?: () => void;
  onError?: (error: Event) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface SSEEventHandler {
  event: string;
  handler: (data: unknown) => void;
}

/**
 * Hook para conectar a Server-Sent Events (SSE)
 * 
 * @example
 * ```tsx
 * const { addEventListener, isConnected } = useSSE({
 *   topic: `user:${userId}`,
 *   onConnected: () => console.log('Connected'),
 * });
 * 
 * useEffect(() => {
 *   const cleanup = addEventListener('session_created', (data) => {
 *     console.log('New session:', data);
 *   });
 *   return cleanup;
 * }, [addEventListener]);
 * ```
 */
export function useSSE(options: SSEOptions) {
  const {
    topic,
    onConnected,
    onError,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handlersRef = useRef<SSEEventHandler[]>([]);
  const connectFnRef = useRef<(() => void) | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Ya conectado
    }

    try {
      const url = `/api/sse/stream?topic=${encodeURIComponent(topic)}`;
      const eventSource = new EventSource(url);

      eventSource.addEventListener('connected', () => {
        console.log(`[SSE] Conectado al topic: ${topic}`);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset contador
        onConnected?.();
      });

      eventSource.addEventListener('error', (error) => {
        console.error(`[SSE] Error en topic ${topic}:`, error);
        setIsConnected(false);
        onError?.(error);

        // Auto-reconectar si no se alcanzó el máximo de intentos
        if (
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          eventSource.readyState === EventSource.CLOSED
        ) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * reconnectAttemptsRef.current;
          console.log(
            `[SSE] Reintentando conexión en ${delay}ms (intento ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
            connectFnRef.current?.(); // Usar ref en lugar de connect
          }, delay);
        }
      });

      // Registrar handlers previos
      handlersRef.current.forEach(({ event, handler }) => {
        eventSource.addEventListener(event, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handler(data);
          } catch (error) {
            console.error(`[SSE] Error parsing event ${event}:`, error);
            handler(e.data);
          }
        });
      });

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('[SSE] Error al crear conexión:', error);
    }
  }, [topic, onConnected, onError, reconnectDelay, maxReconnectAttempts]);

  // Almacenar connect en ref para uso en callback de error
  useEffect(() => {
    connectFnRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log(`[SSE] Desconectado del topic: ${topic}`);
    }
  }, [topic]);

  const addEventListener = useCallback(
    (event: string, handler: (data: unknown) => void) => {
      // Guardar handler en ref para re-registrar en reconexiones
      handlersRef.current.push({ event, handler });

      // Registrar en EventSource actual si existe
      if (eventSourceRef.current) {
        eventSourceRef.current.addEventListener(event, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handler(data);
          } catch (error) {
            console.error(`[SSE] Error parsing event ${event}:`, error);
            handler(e.data);
          }
        });
      }

      // Retornar función de cleanup
      return () => {
        handlersRef.current = handlersRef.current.filter(
          (h) => h.event !== event || h.handler !== handler
        );
      };
    },
    []
  );

  // Conectar al montar, desconectar al desmontar
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    addEventListener,
    isConnected,
    reconnect: connect,
    disconnect,
  };
}
