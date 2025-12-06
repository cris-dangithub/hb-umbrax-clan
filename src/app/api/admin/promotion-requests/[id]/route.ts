import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, canApprovePromotionToRank } from '@/lib/get-current-user'
import { createAuditLog } from '@/lib/audit'
import { reviewPromotionRequestSchema } from '@/schemas/admin'

/**
 * GET /api/admin/promotion-requests/[id]
 * Obtiene detalles de una solicitud específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    const promotionRequest = await prisma.promotionRequest.findUnique({
      where: { id },
      include: {
        subjectUser: {
          select: {
            id: true,
            habboName: true,
            avatarUrl: true,
          },
        },
        currentRank: true,
        targetRank: true,
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
    })

    if (!promotionRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: promotionRequest })
  } catch (error) {
    console.error('Error al obtener solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/promotion-requests/[id]
 * Aprueba o rechaza una solicitud de ascenso
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const validation = reviewPromotionRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { status, reviewNotes } = validation.data

    // Obtener la solicitud
    const promotionRequest = await prisma.promotionRequest.findUnique({
      where: { id },
      include: {
        subjectUser: {
          select: {
            id: true,
            habboName: true,
          },
        },
        targetRank: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    })

    if (!promotionRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que está pendiente
    if (promotionRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta solicitud ya fue revisada' },
        { status: 400 }
      )
    }

    // Verificar permisos
    const canApprove = await canApprovePromotionToRank(
      promotionRequest.targetRank.order
    )
    if (!canApprove) {
      return NextResponse.json(
        { error: 'No tienes permisos para aprobar ascensos a este rango' },
        { status: 403 }
      )
    }

    // Actualizar solicitud
    const updatedRequest = await prisma.promotionRequest.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
      },
    })

    // Si fue aprobada, actualizar el rango del usuario
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: promotionRequest.subjectUserId },
        data: { rankId: promotionRequest.targetRankId },
      })
    }

    // Registrar en auditoría
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined

    await createAuditLog({
      userId: currentUser.id,
      action:
        status === 'APPROVED'
          ? 'PROMOTION_REQUEST_APPROVED'
          : 'PROMOTION_REQUEST_REJECTED',
      entityType: 'PromotionRequest',
      entityId: id,
      details: {
        subjectUserId: promotionRequest.subjectUserId,
        subjectUserName: promotionRequest.subjectUser.habboName,
        targetRankId: promotionRequest.targetRankId,
        targetRankName: promotionRequest.targetRank.name,
        reviewNotes,
        status,
      },
      ipAddress,
    })

    return NextResponse.json({
      success: true,
      message:
        status === 'APPROVED'
          ? 'Solicitud aprobada y usuario ascendido'
          : 'Solicitud rechazada',
      data: updatedRequest,
    })
  } catch (error) {
    console.error('Error al revisar solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
