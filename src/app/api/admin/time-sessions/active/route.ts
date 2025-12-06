import { NextResponse } from 'next/server';
import { getCurrentUser, hasFullAccess } from '@/lib/get-current-user';
import { getActiveTimeSessions } from '@/lib/time-tracking';

type ActiveTimeSession = Awaited<ReturnType<typeof getActiveTimeSessions>>[number];

/**
 * GET /api/admin/time-sessions/active
 * Obtiene las sesiones de time activas según permisos
 * - Cúpula Directiva: Todas las sesiones activas
 * - Soberanos: Sesiones donde son el supervisor actual
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que tiene permisos (Cúpula, Soberano, o Súbdito con sesión activa)
    const isCupula = await hasFullAccess();
    const isSovereign = currentUser.isSovereign;
    const isSubdito = currentUser.rank.order >= 5 && currentUser.rank.order <= 10;

    // Obtener sesiones activas según rol
    let sessions;
    if (isCupula) {
      // Cúpula ve todas las sesiones
      sessions = await getActiveTimeSessions();
    } else if (isSovereign) {
      // Soberano solo ve sus sesiones supervisadas
      sessions = await getActiveTimeSessions(currentUser.id);
    } else if (isSubdito) {
      // Súbdito solo ve su propia sesión activa (como sujeto)
      const allSessions = await getActiveTimeSessions();
      sessions = allSessions.filter((s: ActiveTimeSession) => s.subjectUser.id === currentUser.id);
    } else {
      return NextResponse.json(
        { error: 'No tienes permisos para ver sesiones de time' },
        { status: 403 }
      );
    }

    // Calcular tiempo transcurrido para cada sesión
    const now = new Date();
    const sessionsWithElapsed = sessions.map((session: ActiveTimeSession) => {
      const activeSegment = session.segments[0];
      const sessionStartMs = session.startedAt.getTime();
      const elapsedMinutes = Math.floor((now.getTime() - sessionStartMs) / (1000 * 60));

      return {
        ...session,
        elapsedMinutes,
        currentSupervisor: activeSegment?.currentSupervisor || null,
      };
    });

    return NextResponse.json({
      success: true,
      sessions: sessionsWithElapsed,
      count: sessionsWithElapsed.length,
    });
  } catch (error) {
    console.error('Error obteniendo sesiones activas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
