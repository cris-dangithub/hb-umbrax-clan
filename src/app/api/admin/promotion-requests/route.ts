import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getCurrentUser,
  hasAdminAccess,
  isSubordinate,
} from '@/lib/get-current-user'
import { getUserRole, UserRole } from '@/lib/roles'
import { createAuditLog } from '@/lib/audit'
import {
  parsePaginationParams,
  parseIntParam,
  getSkipValue,
  buildPaginatedResponse,
} from '@/lib/pagination'
import { createPromotionRequestSchema } from '@/schemas/admin'
import { PromotionStatus } from '@prisma/client'

/**
 * GET /api/admin/promotion-requests
 * Lista solicitudes de ascenso con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await hasAdminAccess()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      )
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { page, limit } = parsePaginationParams(searchParams, 20, 50)
    const targetRankId = parseIntParam(searchParams, 'targetRankId')
    const subjectUserId = searchParams.get('subjectUserId')
    const requestedById = searchParams.get('requestedById')
    const statusParam = searchParams.get('status')

    // Construir filtros
    const where: {
      targetRankId?: number
      subjectUserId?: string
      requestedById?: string
      status?: PromotionStatus
      targetRank?: { order?: number }
    } = {}

    if (targetRankId) {
      where.targetRankId = targetRankId
    }

    if (subjectUserId) {
      where.subjectUserId = subjectUserId
    }

    if (requestedById) {
      where.requestedById = requestedById
    }

    if (statusParam && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusParam)) {
      where.status = statusParam as PromotionStatus
    }

    // Si es soberano (no cúpula), solo ver solicitudes relevantes a su rango
    const role = getUserRole(currentUser)
    if (role === UserRole.SOBERANO) {
      // Ver solicitudes a su rango que estén pendientes, o las que creó
      where.targetRank = { order: currentUser.rank.order }
    }

    const [requests, total] = await Promise.all([
      prisma.promotionRequest.findMany({
        where,
        skip: getSkipValue(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subjectUser: {
            select: {
              id: true,
              habboName: true,
              avatarUrl: true,
            },
          },
          currentRank: {
            select: {
              id: true,
              name: true,
              order: true,
              icon: true,
            },
          },
          targetRank: {
            select: {
              id: true,
              name: true,
              order: true,
              icon: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              habboName: true,
              avatarUrl: true,
              rank: {
                select: {
                  name: true,
                  order: true,
                },
              },
            },
          },
          reviewedBy: {
            select: {
              id: true,
              habboName: true,
              rank: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.promotionRequest.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(requests, page, limit, total))
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/promotion-requests
 * Crea una nueva solicitud de ascenso
 */
export async function POST(request: NextRequest) {
  try {
    const adminAccess = await hasAdminAccess()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      )
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createPromotionRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { subjectUserId, targetRankId, justification } = validation.data

    // Verificar que el sujeto existe
    const subjectUser = await prisma.user.findUnique({
      where: { id: subjectUserId },
      include: { rank: true },
    })

    if (!subjectUser) {
      return NextResponse.json(
        { error: 'Usuario objetivo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que es un súbdito
    if (!isSubordinate(subjectUser.rank.order)) {
      return NextResponse.json(
        { error: 'Solo se pueden crear solicitudes para súbditos (rangos 5-10)' },
        { status: 400 }
      )
    }

    // Verificar que el rango objetivo existe
    const targetRank = await prisma.rank.findUnique({
      where: { id: targetRankId },
    })

    if (!targetRank) {
      return NextResponse.json({ error: 'Rango objetivo no encontrado' }, { status: 404 })
    }

    // Verificar que el ascenso es lógico (el target debe ser menor order = mayor jerarquía)
    if (targetRank.order >= subjectUser.rank.order) {
      return NextResponse.json(
        { error: 'El rango objetivo debe ser superior al rango actual' },
        { status: 400 }
      )
    }

    // Crear solicitud
    const promotionRequest = await prisma.promotionRequest.create({
      data: {
        subjectUserId,
        currentRankId: subjectUser.rankId,
        targetRankId,
        requestedById: currentUser.id,
        justification,
        status: 'PENDING',
      },
      include: {
        subjectUser: {
          select: {
            habboName: true,
          },
        },
        targetRank: {
          select: {
            name: true,
          },
        },
      },
    })

    // Registrar en auditoría
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined

    await createAuditLog({
      userId: currentUser.id,
      action: 'PROMOTION_REQUEST_CREATED',
      entityType: 'PromotionRequest',
      entityId: promotionRequest.id,
      details: {
        subjectUserName: promotionRequest.subjectUser.habboName,
        currentRankId: subjectUser.rankId,
        targetRankId,
        targetRankName: promotionRequest.targetRank.name,
        justification,
      },
      ipAddress,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitud de ascenso creada correctamente',
        data: promotionRequest,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
