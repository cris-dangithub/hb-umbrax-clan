import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { can, isCupula } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para actualizar sesión
const updateSessionSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  streamUrl: z.string().url().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']).optional(),
})

/**
 * GET /api/radio/sessions/[id]
 * Obtiene una sesión de radio por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const session = await prisma.radioSession.findUnique({
      where: { id },
      include: {
        dj: {
          select: {
            id: true,
            habboName: true,
            avatarUrl: true,
            rank: {
              select: {
                name: true,
                icon: true,
                order: true,
              },
            },
          },
        },
        songRequests: {
          include: {
            requestedBy: {
              select: {
                id: true,
                habboName: true,
                avatarUrl: true,
                rank: {
                  select: {
                    name: true,
                    icon: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error al obtener sesión:', error)
    return NextResponse.json(
      { error: 'Error al obtener sesión' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/radio/sessions/[id]
 * Actualiza una sesión de radio (solo el DJ creador o Cúpula)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const session = await prisma.radioSession.findUnique({
      where: { id },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Solo el DJ creador o Cúpula pueden actualizar
    if (session.djId !== currentUser.id && !isCupula(currentUser)) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta sesión' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateSessionSchema.parse(body)

    // Si cambia a LIVE, validar permisos y registrar actualStart
    if (validatedData.status === 'LIVE' && session.status !== 'LIVE') {
      if (!can(currentUser, 'start_radio_session')) {
        return NextResponse.json(
          { error: 'No tienes permisos para iniciar sesiones' },
          { status: 403 }
        )
      }
      
      const updatedSession = await prisma.radioSession.update({
        where: { id },
        data: {
          ...validatedData,
          actualStart: new Date(),
        },
        include: {
          dj: {
            select: {
              id: true,
              habboName: true,
              avatarUrl: true,
            },
          },
        },
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'RADIO_SESSION_STARTED',
          entityType: 'RadioSession',
          entityId: session.id,
          details: JSON.stringify({
            title: session.title,
            actualStart: updatedSession.actualStart,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      })

      return NextResponse.json({ session: updatedSession })
    }

    // Si cambia a ENDED, validar permisos y registrar actualEnd
    if (validatedData.status === 'ENDED' && session.status !== 'ENDED') {
      if (!can(currentUser, 'end_radio_session')) {
        return NextResponse.json(
          { error: 'No tienes permisos para finalizar sesiones' },
          { status: 403 }
        )
      }

      const updatedSession = await prisma.radioSession.update({
        where: { id },
        data: {
          ...validatedData,
          actualEnd: new Date(),
        },
        include: {
          dj: {
            select: {
              id: true,
              habboName: true,
              avatarUrl: true,
            },
          },
        },
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'RADIO_SESSION_ENDED',
          entityType: 'RadioSession',
          entityId: session.id,
          details: JSON.stringify({
            title: session.title,
            actualEnd: updatedSession.actualEnd,
            duration: updatedSession.actualStart && updatedSession.actualEnd
              ? Math.round((updatedSession.actualEnd.getTime() - updatedSession.actualStart.getTime()) / 60000)
              : null,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      })

      return NextResponse.json({ session: updatedSession })
    }

    // Actualización normal
    const updatedSession = await prisma.radioSession.update({
      where: { id },
      data: validatedData,
      include: {
        dj: {
          select: {
            id: true,
            habboName: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error al actualizar sesión:', error)
    return NextResponse.json(
      { error: 'Error al actualizar sesión' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/radio/sessions/[id]
 * Elimina una sesión de radio (solo el DJ creador o Cúpula)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const session = await prisma.radioSession.findUnique({
      where: { id },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Solo el DJ creador o Cúpula pueden eliminar
    if (session.djId !== currentUser.id && !isCupula(currentUser)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta sesión' },
        { status: 403 }
      )
    }

    // No permitir eliminar sesiones en vivo
    if (session.status === 'LIVE') {
      return NextResponse.json(
        { error: 'No se puede eliminar una sesión en vivo. Finalízala primero.' },
        { status: 400 }
      )
    }

    await prisma.radioSession.delete({
      where: { id },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'RADIO_SESSION_CANCELLED',
        entityType: 'RadioSession',
        entityId: session.id,
        details: JSON.stringify({
          title: session.title,
          scheduledStart: session.scheduledStart,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar sesión:', error)
    return NextResponse.json(
      { error: 'Error al eliminar sesión' },
      { status: 500 }
    )
  }
}
