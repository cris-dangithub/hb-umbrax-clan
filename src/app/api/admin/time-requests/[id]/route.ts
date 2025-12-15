import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { websocketClient } from '@/lib/websocket-client';

// Schema de validación para responder solicitud
const respondTimeRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  responseNotes: z.string().optional(),
});

/**
 * PATCH /api/admin/time-requests/[id]
 * Aprueba o rechaza una solicitud de time
 * Permisos: Solo el súbdito objetivo puede responder
 */
export async function PATCH(
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

    // Obtener solicitud
    const timeRequest = await prisma.timeRequest.findUnique({
      where: { id },
      include: {
        subjectUser: {
          include: {
            rank: true,
          },
        },
        createdBy: {
          include: {
            rank: true,
          },
        },
      },
    });

    if (!timeRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario actual es el súbdito objetivo
    if (timeRequest.subjectUserId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Solo el súbdito objetivo puede responder esta solicitud' },
        { status: 403 }
      );
    }

    // Verificar que está pendiente
    if (timeRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'La solicitud ya fue respondida' },
        { status: 400 }
      );
    }

    // Verificar que no expiró
    const now = new Date();
    if (timeRequest.expiresAt < now) {
      // Marcar como expirada
      await prisma.timeRequest.update({
        where: { id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        { error: 'La solicitud ha expirado' },
        { status: 400 }
      );
    }

    // Validar datos
    const body = await request.json();
    const validatedData = respondTimeRequestSchema.parse(body);

    const isApproved = validatedData.action === 'approve';
    const newStatus = isApproved ? 'APPROVED' : 'REJECTED';

    // Si se aprueba, crear sesión y segmento inicial
    let sessionId: string | undefined;
    if (isApproved) {
      console.log(`[TimeRequest] Creando sesión para súbdito ${currentUser.habboName} (${currentUser.id}) con supervisor ${timeRequest.createdById}`);
      const session = await prisma.timeSession.create({
        data: {
          subjectUserId: currentUser.id,
          status: 'ACTIVE',
          segments: {
            create: {
              currentSupervisorId: timeRequest.createdById,
            },
          },
        },
        include: {
          segments: true,
        },
      });

      sessionId = session.id;
      console.log(`[TimeRequest] Sesión creada con ID: ${sessionId}`);
    }

    // Actualizar solicitud
    const updatedRequest = await prisma.timeRequest.update({
      where: { id },
      data: {
        status: newStatus,
        respondedById: currentUser.id,
        responseNotes: validatedData.responseNotes,
        respondedAt: now,
      },
      include: {
        subjectUser: {
          include: {
            rank: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            habboName: true,
          },
        },
      },
    });

    // Crear log de auditoría
    await createAuditLog({
      userId: currentUser.id,
      action: isApproved ? 'TIME_REQUEST_APPROVED' as 'USER_LOGIN' : 'TIME_REQUEST_REJECTED' as 'USER_LOGIN',
      entityType: 'TimeRequest',
      entityId: id,
      details: {
        requestId: id,
        subjectUserId: currentUser.id,
        subjectName: currentUser.habboName,
        createdBy: timeRequest.createdBy.habboName,
        action: validatedData.action,
        responseNotes: validatedData.responseNotes,
        sessionId,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    // Emitir eventos WebSocket
    if (isApproved && sessionId) {
      console.log(`[TimeRequest] Emitiendo eventos WebSocket para sesión ${sessionId}`);
      
      // Obtener la sesión completa con todos los datos para evitar refetch en frontend
      const fullSession = await prisma.timeSession.findUnique({
        where: { id: sessionId },
        include: {
          subjectUser: {
            include: {
              rank: true,
            },
          },
          segments: {
            where: { endedAt: null },
            include: {
              currentSupervisor: {
                include: {
                  rank: true,
                },
              },
            },
          },
        },
      });

      if (!fullSession) {
        throw new Error('No se pudo obtener la sesión creada');
      }

      // Payload completo para evitar refetch en ActiveTimesTable
      const sessionCreatedPayload = {
        sessionId,
        subjectUserId: currentUser.id,
        subjectName: currentUser.habboName,
        subjectAvatarUrl: currentUser.avatarUrl,
        subjectRank: currentUser.rank.name,
        subjectRankOrder: currentUser.rank.order,
        subjectRankMissionGoal: currentUser.rank.missionPromotionGoal,
        supervisorId: timeRequest.createdById,
        supervisorName: timeRequest.createdBy.habboName,
        supervisorRank: timeRequest.createdBy.rank?.name || 'Desconocido',
        startedAt: fullSession.startedAt.toISOString(),
        timestamp: now.toISOString(),
      };
      
      // Notificar al súbdito que su sesión fue creada
      console.log(`[TimeRequest] Emitiendo session_created a user:${currentUser.id} (súbdito)`);
      await websocketClient.publish(`user:${currentUser.id}`, 'session_created', sessionCreatedPayload);

      // Notificar al supervisor que la sesión fue creada (para actualizar ActiveTimesTable)
      console.log(`[TimeRequest] Emitiendo session_created a user:${timeRequest.createdById} (supervisor)`);
      await websocketClient.publish(`user:${timeRequest.createdById}`, 'session_created', sessionCreatedPayload);

      // Notificar al supervisor que su solicitud fue aprobada
      console.log(`[TimeRequest] Emitiendo time_request_result a user:${timeRequest.createdById} (supervisor)`);
      await websocketClient.publish(`user:${timeRequest.createdById}`, 'time_request_result', {
        requestId: id,
        status: 'approved',
        subjectUserId: currentUser.id,
        subjectName: currentUser.habboName,
        sessionId,
        timestamp: now.toISOString(),
      });
    } else {
      // Notificar al supervisor que su solicitud fue rechazada
      await websocketClient.publish(`user:${timeRequest.createdById}`, 'time_request_result', {
        requestId: id,
        status: 'rejected',
        subjectUserId: currentUser.id,
        subjectName: currentUser.habboName,
        timestamp: now.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      timeRequest: updatedRequest,
      sessionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error respondiendo solicitud de time:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
