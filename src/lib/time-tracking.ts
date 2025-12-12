import { prisma } from './prisma';
import { calculateElapsedMinutes } from './time-utils';

// Re-exportar funciones puras para mantener compatibilidad
export {
  parseMissionGoal,
  formatMinutesToReadable,
  formatMinutesToHHMMSS,
  calculateElapsedMinutes,
  calculateProgressPercentage
} from './time-utils';

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
