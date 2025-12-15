'use client';

import { useEffect, useCallback } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import type { EventHandler } from '@/lib/websocket-protocol';

interface UseWebSocketOptions {
  topics?: string[]; // Topics a los que suscribirse automáticamente
  events?: { [eventName: string]: EventHandler }; // Handlers de eventos
  autoSubscribe?: boolean; // Auto-suscribir al montar (default: true)
}

/**
 * Hook para usar WebSocket en componentes
 * Maneja suscripciones automáticas y registro de event handlers
 * 
 * @example
 * ```tsx
 * const { state, subscribe } = useWebSocket({
 *   topics: [`user:${userId}`],
 *   events: {
 *     'time_request': (data) => console.log('Nueva solicitud:', data),
 *     'session_closed': (data) => console.log('Sesión cerrada:', data),
 *   }
 * });
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { topics = [], events = {}, autoSubscribe = true } = options;
  const context = useWebSocketContext();

  // Auto-suscribir a topics
  useEffect(() => {
    if (!autoSubscribe || topics.length === 0) return;

    topics.forEach((topic) => {
      context.subscribe(topic);
    });

    // Cleanup: desuscribir al desmontar
    return () => {
      topics.forEach((topic) => {
        context.unsubscribe(topic);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(topics), autoSubscribe]);

  // Registrar event handlers
  useEffect(() => {
    const unsubscribeFns: Array<() => void> = [];

    Object.entries(events).forEach(([eventName, handler]) => {
      const unsubscribe = context.on(eventName, handler);
      unsubscribeFns.push(unsubscribe);
    });

    // Cleanup: eliminar handlers al desmontar
    return () => {
      unsubscribeFns.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(Object.keys(events))]);

  // Funciones auxiliares
  const subscribe = useCallback((topic: string) => {
    context.subscribe(topic);
  }, [context]);

  const unsubscribe = useCallback((topic: string) => {
    context.unsubscribe(topic);
  }, [context]);

  const on = useCallback((event: string, handler: EventHandler) => {
    return context.on(event, handler);
  }, [context]);

  return {
    state: context.state,
    userId: context.userId,
    subscribe,
    unsubscribe,
    on,
    reconnect: context.reconnect,
  };
}

/**
 * Hook simple para suscribirse a un evento específico
 * 
 * @example
 * ```tsx
 * useWebSocketEvent('time_request', (data) => {
 *   console.log('Nueva solicitud de time:', data);
 * });
 * ```
 */
export function useWebSocketEvent<T = unknown>(
  eventName: string,
  handler: EventHandler<T>
) {
  const context = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = context.on(eventName, handler as EventHandler);
    return unsubscribe;
  }, [eventName, handler, context]);
}
