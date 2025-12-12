import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasFullAccess } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { getActiveSegment } from '@/lib/time-tracking';
import { sseEmitter } from '@/lib/sse-emitter';

// Schema de validación para transferir supervisor
const transferSupervisorSchema = z.object({
  newSupervisorId: z.string().uuid(),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/time-sessions/[id]/transfer
 * Transfiere la supervisión de una sesión activa a otro usuario
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
        { error: 'Solo se pueden transferir sesiones activas' },
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
        { error: 'No tienes permisos para transferir esta sesión' },
        { status: 403 }
      );
    }

    // Validar datos
    const body = await request.json();
    const validatedData = transferSupervisorSchema.parse(body);

    // Verificar que el nuevo supervisor existe y tiene permisos
    const newSupervisor = await prisma.user.findUnique({
      where: { id: validatedData.newSupervisorId },
      include: { rank: true },
    });

    if (!newSupervisor) {
      return NextResponse.json(
        { error: 'Nuevo supervisor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el nuevo supervisor es Cúpula o Soberano
    const newSupervisorIsCupula = newSupervisor.rank.order <= 3;
    const newSupervisorIsSovereign = newSupervisor.isSovereign;

    if (!newSupervisorIsCupula && !newSupervisorIsSovereign) {
      return NextResponse.json(
        { error: 'El nuevo supervisor debe ser Cúpula o Soberano' },
        { status: 400 }
      );
    }

    // Verificar que no se transfiera al mismo supervisor
    if (activeSegment.currentSupervisorId === validatedData.newSupervisorId) {
      return NextResponse.json(
        { error: 'El nuevo supervisor es el mismo que el actual' },
        { status: 400 }
      );
    }

    // Calcular tiempo del segmento actual
    const now = new Date();
    const segmentStartMs = activeSegment.startedAt.getTime();
    const segmentMinutes = Math.floor((now.getTime() - segmentStartMs) / (1000 * 60));

    // Cerrar segmento actual
    await prisma.timeSegment.update({
      where: { id: activeSegment.id },
      data: {
        endedAt: now,
        minutes: segmentMinutes,
      },
    });

    // Crear nuevo segmento con nuevo supervisor
    const newSegment = await prisma.timeSegment.create({
      data: {
        sessionId: session.id,
        currentSupervisorId: validatedData.newSupervisorId,
      },
      include: {
        currentSupervisor: {
          select: {
            id: true,
            habboName: true,
            rank: true,
          },
        },
      },
    });

    // Crear log de auditoría
    await createAuditLog({
      userId: currentUser.id,
      action: 'TIME_SUPERVISOR_TRANSFERRED' as 'USER_LOGIN',
      entityType: 'TimeSession',
      entityId: session.id,
      details: {
        sessionId: session.id,
        subjectUserId: session.subjectUserId,
        subjectName: session.subjectUser.habboName,
        previousSupervisorId: activeSegment.currentSupervisorId,
        previousSupervisorName: activeSegment.currentSupervisor.habboName,
        newSupervisorId: newSupervisor.id,
        newSupervisorName: newSupervisor.habboName,
        transferredBy: currentUser.habboName,
        transferredByRole: isCupula ? 'Cúpula' : 'Supervisor',
        notes: validatedData.notes,
        previousSegmentMinutes: segmentMinutes,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    // Emitir evento SSE - Notificar al súbdito y ambos supervisores
    sseEmitter.publishToMultiple(
      [
        `user:${session.subjectUserId}`,
        `user:${activeSegment.currentSupervisorId}`,
        `user:${newSupervisor.id}`,
      ],
      'session_updated',
      {
        sessionId: session.id,
        subjectUserId: session.subjectUserId,
        subjectName: session.subjectUser.habboName,
        action: 'supervisor_transferred',
        previousSupervisorId: activeSegment.currentSupervisorId,
        previousSupervisorName: activeSegment.currentSupervisor.habboName,
        newSupervisorId: newSupervisor.id,
        newSupervisorName: newSupervisor.habboName,
        previousSegmentMinutes: segmentMinutes,
        timestamp: now.toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      newSegment,
      previousSegmentMinutes: segmentMinutes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error transfiriendo supervisor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
