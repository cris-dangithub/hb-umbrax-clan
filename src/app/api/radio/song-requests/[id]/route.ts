import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { can } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para actualizar estado de solicitud
const updateRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'PLAYED']),
})

/**
 * PATCH /api/radio/song-requests/[id]
 * Actualiza el estado de una solicitud (solo DJ o Cúpula)
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

    // Verificar permisos de moderación
    if (!can(currentUser, 'moderate_song_requests')) {
      return NextResponse.json(
        { error: 'No tienes permisos para moderar solicitudes' },
        { status: 403 }
      )
    }

    const { id } = await params

    const songRequest = await prisma.songRequest.findUnique({
      where: { id },
      include: {
        session: true,
      },
    })

    if (!songRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateRequestSchema.parse(body)

    const updatedRequest = await prisma.songRequest.update({
      where: { id },
      data: {
        status: validatedData.status,
        respondedAt: new Date(),
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            habboName: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error al actualizar solicitud:', error)
    return NextResponse.json(
      { error: 'Error al actualizar solicitud' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/radio/song-requests/[id]
 * Elimina una solicitud (solo el creador o DJ/Cúpula)
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

    const songRequest = await prisma.songRequest.findUnique({
      where: { id },
    })

    if (!songRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos: creador o DJ/Cúpula
    if (
      songRequest.requestedById !== currentUser.id &&
      !can(currentUser, 'moderate_song_requests')
    ) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta solicitud' },
        { status: 403 }
      )
    }

    await prisma.songRequest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar solicitud:', error)
    return NextResponse.json(
      { error: 'Error al eliminar solicitud' },
      { status: 500 }
    )
  }
}
