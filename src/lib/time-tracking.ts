import { prisma } from './prisma';

/**
 * Parsea string de meta de misión formato "dd HH:mm" a minutos totales
 * @param goalString - String en formato "dd HH:mm" (ej: "02 15:30")
 * @returns Total de minutos o null si inválido
 */
export function parseMissionGoal(goalString: string | null): number | null {
  if (!goalString) return null;
  
  const match = goalString.match(/^(\d{2})\s(\d{2}):(\d{2})$/);
  if (!match) return null;
  
  const [, days, hours, minutes] = match;
  const totalMinutes = 
    parseInt(days) * 24 * 60 + 
    parseInt(hours) * 60 + 
    parseInt(minutes);
  
  return totalMinutes;
}

/**
 * Formatea minutos a string legible "Xd Xh Xm"
 * @param minutes - Total de minutos
 * @returns String formateado
 */
export function formatMinutesToReadable(minutes: number): string {
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  
  return parts.length > 0 ? parts.join(' ') : '0m';
}

/**
 * Formatea minutos a formato "HH:mm:ss"
 * @param minutes - Total de minutos
 * @returns String en formato HH:mm:ss
 */
export function formatMinutesToHHMMSS(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes * 60) % 60);
  
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Calcula minutos transcurridos desde una fecha hasta ahora
 * @param startDate - Fecha de inicio
 * @returns Minutos transcurridos
 */
export function calculateElapsedMinutes(startDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Calcula porcentaje de progreso hacia meta
 * @param currentMinutes - Minutos actuales
 * @param goalMinutes - Minutos de la meta
 * @returns Porcentaje (0-100), o null si no hay meta
 */
export function calculateProgressPercentage(
  currentMinutes: number, 
  goalMinutes: number | null
): number | null {
  if (!goalMinutes || goalMinutes === 0) return null;
  return Math.min(100, Math.round((currentMinutes / goalMinutes) * 100));
}

/**
 * Calcula el tiempo total de una sesión sumando todos sus segmentos
 * @param sessionId - ID de la sesión
 * @returns Total de minutos
 */
export async function calculateSessionTotalMinutes(sessionId: string): Promise<number> {
  // Obtener sesión con segmentos
  const session = await prisma.timeSession.findUnique({
    where: { id: sessionId },
    include: {
      segments: {
        orderBy: { startedAt: 'asc' }
      }
    }
  });

  if (!session) return 0;

  let totalMinutes = 0;

  // Sumar minutos de cada segmento
  for (const segment of session.segments) {
    if (segment.minutes !== null) {
      // Segmento cerrado, usar valor calculado
      totalMinutes += segment.minutes;
    } else {
      // Segmento activo, calcular tiempo desde inicio
      totalMinutes += calculateElapsedMinutes(segment.startedAt);
    }
  }

  return totalMinutes;
}

/**
 * Limpia solicitudes de time expiradas (TTL 5 minutos)
 * Marca como EXPIRED las solicitudes PENDING que pasaron su expiresAt
 */
export async function cleanExpiredRequests(): Promise<number> {
  const now = new Date();
  
  const result = await prisma.timeRequest.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: {
        lt: now
      }
    },
    data: {
      status: 'EXPIRED'
    }
  });
  
  return result.count;
}

/**
 * Obtiene todas las sesiones activas con información del súbdito y supervisor actual
 * @param supervisorId - Si se provee, filtra por supervisor actual (opcional)
 * @returns Array de sesiones activas con datos relacionados
 */
export async function getActiveTimeSessions(supervisorId?: string) {
  return await prisma.timeSession.findMany({
    where: {
      status: 'ACTIVE',
      ...(supervisorId && {
        segments: {
          some: {
            currentSupervisorId: supervisorId,
            endedAt: null
          }
        }
      })
    },
    include: {
      subjectUser: {
        include: {
          rank: true
        }
      },
      segments: {
        where: {
          endedAt: null
        },
        include: {
          currentSupervisor: {
            select: {
              id: true,
              habboName: true,
              rank: true
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      startedAt: 'desc'
    }
  });
}

/**
 * Obtiene el segmento activo actual de una sesión
 * @param sessionId - ID de la sesión
 * @returns Segmento activo o null
 */
export async function getActiveSegment(sessionId: string) {
  return await prisma.timeSegment.findFirst({
    where: {
      sessionId,
      endedAt: null
    },
    include: {
      currentSupervisor: true
    }
  });
}

/**
 * Verifica si un usuario tiene una sesión activa
 * @param userId - ID del usuario
 * @returns true si tiene sesión activa
 */
export async function hasActiveSession(userId: string): Promise<boolean> {
  const activeSession = await prisma.timeSession.findFirst({
    where: {
      subjectUserId: userId,
      status: 'ACTIVE'
    }
  });
  
  return activeSession !== null;
}

/**
 * Verifica si un usuario tiene una solicitud pendiente
 * @param userId - ID del usuario
 * @returns true si tiene solicitud pendiente
 */
export async function hasPendingRequest(userId: string): Promise<boolean> {
  const now = new Date();
  
  const pendingRequest = await prisma.timeRequest.findFirst({
    where: {
      subjectUserId: userId,
      status: 'PENDING',
      expiresAt: {
        gt: now
      }
    }
  });
  
  return pendingRequest !== null;
}

/**
 * Obtiene el tiempo total acumulado de un usuario (todas sus sesiones cerradas)
 * @param userId - ID del usuario
 * @returns Total de minutos acumulados
 */
export async function getUserTotalTimeMinutes(userId: string): Promise<number> {
  const closedSessions = await prisma.timeSession.findMany({
    where: {
      subjectUserId: userId,
      status: 'CLOSED',
      totalMinutes: {
        not: null
      }
    },
    select: {
      totalMinutes: true
    }
  });

  return closedSessions.reduce((total: number, session: { totalMinutes: number | null }) => {
    return total + (session.totalMinutes || 0);
  }, 0);
}
