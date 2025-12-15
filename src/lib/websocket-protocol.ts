/**
 * Definiciones de tipos para el protocolo WebSocket
 * Sincronizado con el servidor Rust en ws_server/src/protocol.rs
 */

// Mensajes enviados por el cliente al servidor
export type ClientMessage =
  | { type: 'subscribe'; topic: string }
  | { type: 'unsubscribe'; topic: string }
  | { type: 'ping' }
  | { type: 'close' };

// Mensajes recibidos del servidor
export type ServerMessage =
  | { type: 'connected'; userId: string; timestamp: string }
  | { type: 'event'; topic: string; event: string; data: unknown; timestamp: string }
  | { type: 'pong'; timestamp: string }
  | { type: 'error'; message: string; timestamp: string };

// Tipos de eventos del sistema de time tracking
export type TimeTrackingEvent =
  | 'time_request'
  | 'time_request_result'
  | 'session_created'
  | 'session_updated'
  | 'session_closed';

// Payloads específicos de cada evento
export interface TimeRequestEventData {
  requestId: string;
  supervisorId: string;
  supervisorName: string;
  supervisorRank: string;
  supervisorAvatarUrl: string;
  subjectUserId: string;
  subjectName: string;
  subjectAvatarUrl: string;
  subjectRank: string;
  subjectRankOrder: number;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  timestamp: string;
}

export interface TimeRequestResultEventData {
  requestId: string;
  status: 'approved' | 'rejected';
  subjectUserId: string;
  subjectName: string;
  sessionId?: string;
  timestamp: string;
}

export interface SessionCreatedEventData {
  sessionId: string;
  subjectUserId: string;
  subjectName: string;
  subjectAvatarUrl: string;
  subjectRank: string;
  subjectRankOrder: number;
  subjectRankMissionGoal?: string;
  supervisorId: string;
  supervisorName: string;
  supervisorRank: string;
  startedAt: string;
  timestamp: string;
}

export interface SessionUpdatedEventData {
  sessionId: string;
  subjectUserId: string;
  subjectName: string;
  action: 'supervisor_transferred' | 'other';
  previousSupervisorId?: string;
  previousSupervisorName?: string;
  newSupervisorId?: string;
  newSupervisorName?: string;
  previousSegmentMinutes?: number;
  timestamp: string;
}

export interface SessionClosedEventData {
  sessionId: string;
  subjectUserId: string;
  subjectName: string;
  totalMinutes: number;
  timestamp: string;
}

// Estado de la conexión WebSocket
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// Opciones de configuración del WebSocket
export interface WebSocketConfig {
  url: string;
  token: string;
  reconnectInterval?: number; // ms entre intentos de reconexión (default: 3000)
  maxReconnectAttempts?: number; // máximo de intentos (default: 5)
  pingInterval?: number; // ms entre pings (default: 30000)
}

// Handler para eventos personalizados
export type EventHandler<T = unknown> = (data: T, event: string, topic: string) => void;
