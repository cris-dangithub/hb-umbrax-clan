import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasAdminAccess } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { hasPendingRequest, hasActiveSession } from '@/lib/time-tracking';

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

    // Verificar que es súbdito (rangos 5-10)
    if (subjectUser.rank.order < 5 || subjectUser.rank.order > 10) {
      return NextResponse.json(
        { error: 'Solo se puede solicitar time para súbditos (rangos 5-10)' },
        { status: 400 }
      );
    }

    // Verificar que el solicitante tiene permisos sobre el súbdito
    const isCupula = currentUser.rank.order <= 3;
    const isSovereignOfRank = currentUser.isSovereign && currentUser.rank.order === subjectUser.rank.order;

    if (!isCupula && !isSovereignOfRank) {
      return NextResponse.json(
        { error: 'No tienes permisos para solicitar time a este súbdito' },
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
    const isCupula = currentUser.rank.order <= 3;
    const isSovereignUser = currentUser.isSovereign;
    const isSubordinate = currentUser.rank.order >= 5;

    const whereClause: Record<string, unknown> = {};

    if (onlyPending) {
      whereClause.status = 'PENDING';
      whereClause.expiresAt = { gt: new Date() };
    } else if (statusFilter) {
      whereClause.status = statusFilter;
    }

    // Filtrar según permisos
    if (isSubordinate && !isSovereignUser) {
      // Súbdito normal: solo sus propias solicitudes
      whereClause.subjectUserId = currentUser.id;
    } else if (isSovereignUser && !isCupula) {
      // Soberano no Cúpula: solicitudes de súbditos de su rango
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
