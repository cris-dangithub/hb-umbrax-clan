import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';

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
          select: {
            id: true,
            habboName: true,
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
