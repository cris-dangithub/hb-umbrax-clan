import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasFullAccess } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { calculateSessionTotalMinutes, getActiveSegment } from '@/lib/time-tracking';
import { sseEmitter } from '@/lib/sse-emitter';

/**
 * POST /api/admin/time-sessions/[id]/close
 * Cierra una sesión de time activa
 * Permisos: El supervisor actual del segmento activo O Cúpula Directiva (rangos 1-3)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Await params for Next.js 16 compatibility
    const { id } = await params;

    // Obtener sesión
    const session = await prisma.timeSession.findUnique({
      where: { id },
      include: {
        subjectUser: {
          include: {
            rank: true,
          },
        },
        segments: {
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que está activa
    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'La sesión ya está cerrada' },
        { status: 400 }
      );
    }

    // Obtener segmento activo
    const activeSegment = await getActiveSegment(session.id);
    if (!activeSegment) {
      return NextResponse.json(
        { error: 'No se encontró segmento activo' },
        { status: 400 }
      );
    }

    // Verificar permisos: supervisor actual O Cúpula
    const isCupula = await hasFullAccess();
    const isCurrentSupervisor = activeSegment.currentSupervisorId === currentUser.id;

    if (!isCupula && !isCurrentSupervisor) {
      return NextResponse.json(
        { error: 'No tienes permisos para cerrar esta sesión' },
        { status: 403 }
      );
    }

    // Calcular tiempo del segmento activo
    const now = new Date();
    const segmentStartMs = activeSegment.startedAt.getTime();
    const segmentMinutes = Math.floor((now.getTime() - segmentStartMs) / (1000 * 60));

    // Cerrar segmento activo
    await prisma.timeSegment.update({
      where: { id: activeSegment.id },
      data: {
        endedAt: now,
        minutes: segmentMinutes,
      },
    });

    // Calcular tiempo total de la sesión
    const totalMinutes = await calculateSessionTotalMinutes(session.id);

    // Cerrar sesión
    const closedSession = await prisma.timeSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: now,
        totalMinutes,
      },
      include: {
        subjectUser: {
          include: {
            rank: true,
          },
        },
        segments: {
          include: {
            currentSupervisor: {
              select: {
                id: true,
                habboName: true,
              },
            },
          },
          orderBy: {
            startedAt: 'asc',
          },
        },
      },
    });

    // Crear log de auditoría
    await createAuditLog({
      userId: currentUser.id,
      action: 'TIME_SESSION_CLOSED' as 'USER_LOGIN',
      entityType: 'TimeSession',
      entityId: session.id,
      details: {
        sessionId: session.id,
        subjectUserId: session.subjectUserId,
        subjectName: session.subjectUser.habboName,
        subjectRank: session.subjectUser.rank.name,
        totalMinutes,
        segmentCount: closedSession.segments.length,
        closedBy: currentUser.habboName,
        closedByRole: isCupula ? 'Cúpula' : 'Supervisor',
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    // Emitir evento SSE - Notificar al súbdito y supervisores
    const supervisorIds = Array.from(
      new Set(closedSession.segments.map(seg => seg.currentSupervisor.id))
    );

    sseEmitter.publishToMultiple(
      [`user:${session.subjectUserId}`, ...supervisorIds.map(id => `user:${id}`)],
      'session_closed',
      {
        sessionId: session.id,
        subjectUserId: session.subjectUserId,
        subjectName: session.subjectUser.habboName,
        totalMinutes,
        timestamp: now.toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      session: closedSession,
    });
  } catch (error) {
    console.error('Error cerrando sesión de time:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
