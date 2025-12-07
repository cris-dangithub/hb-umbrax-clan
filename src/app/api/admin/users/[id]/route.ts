import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hasFullAccess, hasAdminAccess } from '@/lib/get-current-user'
import { createAuditLog } from '@/lib/audit'
import {
  updateUserRankSchema,
  updateSovereignSchema,
  deleteUserSchema,
} from '@/schemas/admin'
import { 
  buildRankChangeDetails, 
  buildUserDeleteDetails 
} from '@/lib/audit-details'
import { getUserRole, UserRole } from '@/lib/roles'

/**
 * GET /api/admin/users/[id]
 * Obtiene información detallada de un usuario específico
 * Accesible por Cúpula Directiva (rangos 1-3) y Soberanos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permisos administrativos (Cúpula o Soberano)
    const adminAccess = await hasAdminAccess()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        habboName: true,
        avatarUrl: true,
        rankId: true,
        isSovereign: true,
        ipAddress: true,
        createdAt: true,
        updatedAt: true,
        rank: {
          select: {
            id: true,
            name: true,
            order: true,
            icon: true,
            roleDescription: true,
          },
        },
        promotionRequestsSubject: {
          select: {
            id: true,
            status: true,
            targetRank: {
              select: {
                name: true,
                order: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Actualiza rango o rol de soberano de un usuario
 * Cúpula: Puede cambiar cualquier rango
 * Soberanos: Solo pueden cambiar al rango que ellos mismos tienen
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permisos administrativos (Cúpula o Soberano)
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

    const currentUserRole = getUserRole(currentUser)
    const isCupula = currentUserRole === UserRole.CUPULA
    const isSoberano = currentUserRole === UserRole.SOBERANO

    const { id } = await params
    const body = await request.json()

    // Determinar tipo de actualización
    if ('rankId' in body) {
      // Actualizar rango
      const validation = updateUserRankSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.format() },
          { status: 400 }
        )
      }

      const { rankId, reason } = validation.data

      // Verificar que el usuario existe
      const targetUser = await prisma.user.findUnique({
        where: { id },
        include: { rank: true },
      })

      if (!targetUser) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }

      // Verificar que no se intenta cambiar el rango de un miembro de la Cúpula
      if (targetUser.rank.order <= 3 && !isCupula) {
        return NextResponse.json(
          { error: 'No puedes cambiar el rango de miembros de la Cúpula Directiva' },
          { status: 403 }
        )
      }

      // Verificar que el rango existe
      const newRank = await prisma.rank.findUnique({ where: { id: rankId } })
      if (!newRank) {
        return NextResponse.json({ error: 'Rango no encontrado' }, { status: 404 })
      }

      // Soberanos solo pueden cambiar al rango que ellos mismos tienen
      if (isSoberano && rankId !== currentUser.rankId) {
        return NextResponse.json(
          { error: `Solo puedes asignar usuarios al rango ${currentUser.rank.name} (tu rango actual)` },
          { status: 403 }
        )
      }

      const oldRankId = targetUser.rankId
      const oldRankName = targetUser.rank.name

      // Actualizar rango
      await prisma.user.update({
        where: { id },
        data: { rankId },
      })

      // Registrar en auditoría con detalles enriquecidos
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      
      const auditDetails = buildRankChangeDetails(
        {
          id: currentUser.id,
          username: currentUser.habboName,
          habboName: currentUser.habboName,
          rankId: currentUser.rankId,
        },
        {
          id: targetUser.id,
          username: targetUser.habboName,
          habboName: targetUser.habboName,
          rankId: targetUser.rankId,
        },
        {
          id: oldRankId,
          name: oldRankName,
        },
        {
          id: rankId,
          name: newRank.name,
        },
        reason
      );

      await createAuditLog({
        userId: currentUser.id,
        action: 'USER_RANK_CHANGED',
        entityType: 'User',
        entityId: id,
        details: auditDetails as unknown as Record<string, unknown>,
        ipAddress,
      })

      return NextResponse.json({
        success: true,
        message: 'Rango actualizado correctamente',
      })
    } else if ('isSovereign' in body) {
      // Actualizar rol de soberano - Solo Cúpula puede hacerlo
      if (!isCupula) {
        return NextResponse.json(
          { error: 'Solo la Cúpula Directiva puede gestionar Soberanos' },
          { status: 403 }
        )
      }

      const validation = updateSovereignSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.format() },
          { status: 400 }
        )
      }

      const { isSovereign, reason } = validation.data

      // Verificar que el usuario existe
      const targetUser = await prisma.user.findUnique({
        where: { id },
        include: { rank: true },
      })

      if (!targetUser) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }

      // Verificar que el rango es elegible para ser soberano (4-12)
      // El rango 13 (Sombra Aprendiz) no puede ser soberano
      if (isSovereign && (targetUser.rank.order < 4 || targetUser.rank.order > 12)) {
        return NextResponse.json(
          { error: 'Solo los rangos 4-12 pueden ser asignados como soberanos' },
          { status: 400 }
        )
      }

      // Actualizar rol
      await prisma.user.update({
        where: { id },
        data: { isSovereign },
      })

      // Registrar en auditoría
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      await createAuditLog({
        userId: currentUser.id,
        action: isSovereign ? 'USER_SOVEREIGN_ASSIGNED' : 'USER_SOVEREIGN_REMOVED',
        entityType: 'User',
        entityId: id,
        details: {
          isSovereign,
          reason,
          targetUserName: targetUser.habboName,
          rankName: targetUser.rank.name,
          rankOrder: targetUser.rank.order,
        },
        ipAddress,
      })

      return NextResponse.json({
        success: true,
        message: isSovereign
          ? 'Usuario asignado como soberano'
          : 'Rol de soberano removido',
      })
    } else {
      return NextResponse.json(
        { error: 'Tipo de actualización no especificado' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Elimina un usuario del sistema
 * Solo accesible por Cúpula Directiva (rangos 1-3)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const fullAccess = await hasFullAccess()
    if (!fullAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      )
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const validation = deleteUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { reason } = validation.data

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { rank: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir eliminar usuarios de la cúpula
    if (targetUser.rank.order <= 3) {
      return NextResponse.json(
        { error: 'No se pueden eliminar usuarios de la Cúpula Directiva' },
        { status: 400 }
      )
    }

    // Registrar en auditoría antes de eliminar con detalles enriquecidos
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    
    const auditDetails = buildUserDeleteDetails(
      {
        id: currentUser.id,
        username: currentUser.habboName,
        habboName: currentUser.habboName,
        rankId: currentUser.rankId,
      },
      {
        id: targetUser.id,
        username: targetUser.habboName,
        habboName: targetUser.habboName,
        rankId: targetUser.rankId,
      },
      reason
    );

    await createAuditLog({
      userId: currentUser.id,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      details: auditDetails as unknown as Record<string, unknown>,
      ipAddress,
    })

    // Eliminar usuario
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
