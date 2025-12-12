/**
 * Sistema de Server-Sent Events (SSE) para notificaciones en tiempo real
 * Arquitectura pub/sub optimizada para Next.js
 */

type SSECallback = (data: string) => void;

interface SSESubscriber {
  id: string;
  topic: string;
  callback: SSECallback;
  lastEventId?: string;
}

class SSEEmitter {
  private subscribers: Map<string, SSESubscriber[]> = new Map();
  private eventCounter = 0;

  /**
   * Suscribe un cliente a un topic específico
   * @param topic - Topic a suscribirse (ej: "user:123", "global")
   * @param callback - Función que recibe los eventos
   * @param subscriberId - ID único del suscriptor
   * @returns Función para cancelar suscripción
   */
  subscribe(topic: string, callback: SSECallback, subscriberId: string): () => void {
    const subscriber: SSESubscriber = {
      id: subscriberId,
      topic,
      callback,
    };

    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }

    this.subscribers.get(topic)!.push(subscriber);

    console.log(`[SSE] Cliente ${subscriberId} suscrito a ${topic}`);

    // Retornar función de cleanup
    return () => {
      this.unsubscribe(topic, subscriberId);
    };
  }

  /**
   * Cancela suscripción de un cliente
   */
  unsubscribe(topic: string, subscriberId: string): void {
    const topicSubscribers = this.subscribers.get(topic);
    if (!topicSubscribers) return;

    const filtered = topicSubscribers.filter(sub => sub.id !== subscriberId);
    
    if (filtered.length === 0) {
      this.subscribers.delete(topic);
    } else {
      this.subscribers.set(topic, filtered);
    }

    console.log(`[SSE] Cliente ${subscriberId} desuscrito de ${topic}`);
  }

  /**
   * Publica un evento a todos los suscriptores de un topic
   * @param topic - Topic donde publicar
   * @param event - Nombre del evento
   * @param data - Datos del evento
   */
  publish(topic: string, event: string, data: Record<string, unknown>): void {
    const subscribers = this.subscribers.get(topic);
    if (!subscribers || subscribers.length === 0) {
      console.log(`[SSE] No hay suscriptores para ${topic}`);
      return;
    }

    this.eventCounter++;
    const eventId = `evt-${this.eventCounter}`;
    const timestamp = new Date().toISOString();

    const payload = {
      event,
      data,
      id: eventId,
      timestamp,
    };

    const sseMessage = this.formatSSEMessage(event, payload, eventId);

    console.log(`[SSE] Publicando "${event}" a ${subscribers.length} suscriptores de ${topic}`);

    subscribers.forEach(subscriber => {
      try {
        subscriber.callback(sseMessage);
        subscriber.lastEventId = eventId;
      } catch (error) {
        console.error(`[SSE] Error enviando evento a ${subscriber.id}:`, error);
      }
    });
  }

  /**
   * Publica a múltiples topics
   */
  publishToMultiple(topics: string[], event: string, data: Record<string, unknown>): void {
    topics.forEach(topic => this.publish(topic, event, data));
  }

  /**
   * Formatea mensaje en formato SSE
   */
  private formatSSEMessage(event: string, payload: Record<string, unknown>, eventId: string): string {
    const lines: string[] = [];
    
    lines.push(`id: ${eventId}`);
    lines.push(`event: ${event}`);
    // Solo enviar los datos reales, no el payload wrapper completo
    lines.push(`data: ${JSON.stringify(payload.data)}`);
    lines.push(''); // Línea vacía para terminar mensaje
    
    return lines.join('\n');
  }

  /**
   * Obtiene estadísticas de suscriptores
   */
  getStats() {
    const topics = Array.from(this.subscribers.keys());
    const totalSubscribers = Array.from(this.subscribers.values())
      .reduce((sum, subs) => sum + subs.length, 0);

    return {
      topics,
      totalSubscribers,
      topicDetails: Object.fromEntries(
        Array.from(this.subscribers.entries()).map(([topic, subs]) => [
          topic,
          { count: subs.length, subscribers: subs.map(s => s.id) }
        ])
      ),
    };
  }

  /**
   * Envía heartbeat a todos los clientes conectados
   */
  sendHeartbeat(): void {
    const topics = Array.from(this.subscribers.keys());
    topics.forEach(topic => {
      this.publish(topic, 'heartbeat', { timestamp: new Date().toISOString() });
    });
  }
}

// Singleton global para toda la aplicación
export const sseEmitter = new SSEEmitter();

// Heartbeat cada 30 segundos para mantener conexiones vivas
if (typeof window === 'undefined') {
  // Solo en servidor
  setInterval(() => {
    sseEmitter.sendHeartbeat();
  }, 30000);
}
