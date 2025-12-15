import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasAdminAccess } from '@/lib/get-current-user';
import { getUserRole, UserRole } from '@/lib/roles';
import { createAuditLog } from '@/lib/audit';
import { hasPendingRequest, hasActiveSession } from '@/lib/time-tracking';
import { websocketClient } from '@/lib/websocket-client';

// Schema de validación para crear solicitud de time
const createTimeRequestSchema = z.object({
  subjectUserId: z.string().uuid(),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/time-requests
 * Crea una nueva solicitud de time para un súbdito
 * Permisos: Cúpula Directiva (rangos 1-3) y Soberanos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const hasAccess = await hasAdminAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear solicitudes de time' },
        { status: 403 }
      );
    }

    // Validar datos
    const body = await request.json();
    const validatedData = createTimeRequestSchema.parse(body);

    // Verificar que el súbdito existe
    const subjectUser = await prisma.user.findUnique({
      where: { id: validatedData.subjectUserId },
      include: { rank: true },
    });

    if (!subjectUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario objetivo está en rangos elegibles para time tracking (4-13)
    // Excluye Cúpula Directiva (rangos 1-3)
    if (subjectUser.rank.order < 4 || subjectUser.rank.order > 13) {
      return NextResponse.json(
        { error: 'Solo se puede solicitar time para usuarios de rangos 4-13 (Súbditos y Soberanos)' },
        { status: 400 }
      );
    }

    // Verificar que el solicitante tiene permisos sobre el súbdito
    // Cúpula: puede enviar time a cualquier usuario de rangos 4-13
    // Soberanos: pueden enviar time a cualquier usuario de rangos 4-13 (Súbditos y otros Soberanos)
    const role = getUserRole(currentUser);
    const isCupula = role === UserRole.CUPULA;
    const isSoberano = role === UserRole.SOBERANO;

    if (!isCupula && !isSoberano) {
      return NextResponse.json(
        { error: 'No tienes permisos para solicitar time a este usuario' },
        { status: 403 }
      );
    }

    // Verificar que no tenga solicitud pendiente
    const hasPending = await hasPendingRequest(subjectUser.id);
    if (hasPending) {
      return NextResponse.json(
        { error: 'El súbdito ya tiene una solicitud de time pendiente' },
        { status: 400 }
      );
    }

    // Verificar que no tenga sesión activa
    const hasActive = await hasActiveSession(subjectUser.id);
    if (hasActive) {
      return NextResponse.json(
        { error: 'El súbdito ya tiene una sesión de time activa' },
        { status: 400 }
      );
    }

    // Crear solicitud con TTL de 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const timeRequest = await prisma.timeRequest.create({
      data: {
        subjectUserId: validatedData.subjectUserId,
        createdById: currentUser.id,
        notes: validatedData.notes,
        expiresAt,
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
            rank: true,
          },
        },
      },
    });

    // Crear log de auditoría
    await createAuditLog({
      userId: currentUser.id,
      action: 'TIME_REQUEST_CREATED' as 'USER_LOGIN',
      entityType: 'TimeRequest',
      entityId: timeRequest.id,
      details: {
        subjectUserId: subjectUser.id,
        subjectName: subjectUser.habboName,
        subjectRank: subjectUser.rank.name,
        notes: validatedData.notes,
        expiresAt: expiresAt.toISOString(),
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    // Emitir evento WebSocket al súbdito notificando que recibió una solicitud
    // Incluye datos completos para evitar refetch en el frontend
    await websocketClient.publish(`user:${subjectUser.id}`, 'time_request', {
      requestId: timeRequest.id,
      supervisorId: currentUser.id,
      supervisorName: currentUser.habboName,
      supervisorRank: currentUser.rank.name,
      supervisorAvatarUrl: currentUser.avatarUrl,
      subjectUserId: subjectUser.id,
      subjectName: subjectUser.habboName,
      subjectAvatarUrl: subjectUser.avatarUrl,
      subjectRank: subjectUser.rank.name,
      subjectRankOrder: subjectUser.rank.order,
      notes: validatedData.notes,
      status: 'PENDING',
      createdAt: timeRequest.createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      timeRequest,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creando solicitud de time:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/time-requests
 * Lista solicitudes de time según permisos del usuario
 * - Súbditos: Solo sus propias solicitudes
 * - Soberanos: Solicitudes de súbditos de su rango
 * - Cúpula: Todas las solicitudes
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const onlyPending = searchParams.get('onlyPending') === 'true';

    // Determinar filtros según permisos
    const role = getUserRole(currentUser);
    const isCupula = role === UserRole.CUPULA;
    const isSovereignUser = role === UserRole.SOBERANO;
    const isSubordinate = role === UserRole.SUBDITO;

    const whereClause: Record<string, unknown> = {};

    if (onlyPending) {
      whereClause.status = 'PENDING';
      whereClause.expiresAt = { gt: new Date() };
    } else if (statusFilter) {
      whereClause.status = statusFilter;
    }

    // Filtrar según permisos
    if (isSubordinate) {
      // Súbdito: solo sus propias solicitudes
      whereClause.subjectUserId = currentUser.id;
    } else if (isSovereignUser) {
      // Soberano: solicitudes de usuarios de su rango
      whereClause.subjectUser = {
        rankId: currentUser.rankId,
      };
    }
    // Cúpula: sin filtro adicional (ve todas)

    const timeRequests = await prisma.timeRequest.findMany({
      where: whereClause,
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
            rank: true,
          },
        },
        respondedBy: {
          select: {
            id: true,
            habboName: true,
            rank: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      timeRequests,
    });
  } catch (error) {
    console.error('Error listando solicitudes de time:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
