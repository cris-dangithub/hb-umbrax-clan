import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para crear solicitud de canción
const createSongRequestSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido'),
  songTitle: z.string().min(1, 'El título es requerido').max(200),
  artist: z.string().max(200).optional(),
  message: z.string().max(500).optional(),
})

/**
 * GET /api/radio/song-requests?sessionId=xxx
 * Obtiene las solicitudes de canciones de una sesión
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Se requiere sessionId' },
        { status: 400 }
      )
    }

    const requests = await prisma.songRequest.findMany({
      where: { sessionId },
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
                order: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/radio/song-requests
 * Crea una solicitud de canción (usuarios autenticados)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createSongRequestSchema.parse(body)

    // Verificar que la sesión existe y está en vivo
    const session = await prisma.radioSession.findUnique({
      where: { id: validatedData.sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Solo se pueden hacer solicitudes en sesiones en vivo' },
        { status: 400 }
      )
    }

    // Verificar si las solicitudes están habilitadas (si hay config)
    const config = await prisma.radioConfig.findFirst()
    if (config && !config.requestsEnabled) {
      return NextResponse.json(
        { error: 'Las solicitudes de canciones están deshabilitadas' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya tiene una solicitud pendiente en esta sesión
    const existingRequest = await prisma.songRequest.findFirst({
      where: {
        sessionId: validatedData.sessionId,
        requestedById: currentUser.id,
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente en esta sesión' },
        { status: 400 }
      )
    }

    // Crear solicitud
    const songRequest = await prisma.songRequest.create({
      data: {
        sessionId: validatedData.sessionId,
        requestedById: currentUser.id,
        songTitle: validatedData.songTitle,
        artist: validatedData.artist,
        message: validatedData.message,
        status: 'PENDING',
      },
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
    })

    return NextResponse.json({ request: songRequest }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error al crear solicitud:', error)
    return NextResponse.json(
      { error: 'Error al crear solicitud' },
      { status: 500 }
    )
  }
}
