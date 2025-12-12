import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { can } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para crear sesión
const createSessionSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(100),
  description: z.string().max(500).optional(),
  streamType: z.enum(['YOUTUBE', 'TWITCH', 'ICECAST', 'CUSTOM']),
  streamUrl: z.string().url('URL de stream inválida'),
  scheduledStart: z.string().datetime('Fecha de inicio inválida').optional(),
  scheduledEnd: z.string().datetime('Fecha de fin inválida').optional(),
})

/**
 * GET /api/radio/sessions
 * Obtiene todas las sesiones de radio (programadas, en vivo, finalizadas)
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
    const status = searchParams.get('status') as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | null
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: { status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' } = {}
    if (status) {
      where.status = status
    }

    const sessions = await prisma.radioSession.findMany({
      where,
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
        _count: {
          select: {
            songRequests: true,
          },
        },
      },
      orderBy: [
        { scheduledStart: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error al obtener sesiones de radio:', error)
    return NextResponse.json(
      { error: 'Error al obtener sesiones de radio' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/radio/sessions
 * Crea una nueva sesión de radio (solo Cúpula y DJs)
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

    // Verificar permisos: solo Cúpula y DJs pueden crear sesiones
    if (!can(currentUser, 'create_radio_session')) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear sesiones de radio' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    // Validar fechas solo si ambas están presentes
    let start: Date | null = null
    let end: Date | null = null

    if (validatedData.scheduledStart && validatedData.scheduledEnd) {
      start = new Date(validatedData.scheduledStart)
      end = new Date(validatedData.scheduledEnd)

      if (end <= start) {
        return NextResponse.json(
          { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400 }
        )
      }

      // Validar que no haya otra sesión programada en el mismo horario
      const overlappingSessions = await prisma.radioSession.findMany({
        where: {
          status: { in: ['SCHEDULED', 'LIVE'] },
          scheduledStart: { not: null },
          scheduledEnd: { not: null },
          OR: [
            {
              AND: [
                { scheduledStart: { lte: start } },
                { scheduledEnd: { gte: start } },
              ],
            },
            {
              AND: [
                { scheduledStart: { lte: end } },
                { scheduledEnd: { gte: end } },
              ],
            },
            {
              AND: [
                { scheduledStart: { gte: start } },
                { scheduledEnd: { lte: end } },
              ],
            },
          ],
        },
      })

      if (overlappingSessions.length > 0) {
        return NextResponse.json(
          { error: 'Ya existe una sesión programada en ese horario' },
          { status: 400 }
        )
      }
    } else if (validatedData.scheduledStart || validatedData.scheduledEnd) {
      return NextResponse.json(
        { error: 'Debes proporcionar tanto inicio como fin, o ninguno de los dos' },
        { status: 400 }
      )
    }

    // Crear la sesión
    // Si no tiene fechas, se considera LIVE automáticamente
    const session = await prisma.radioSession.create({
      data: {
        djId: currentUser.id,
        title: validatedData.title,
        description: validatedData.description,
        streamType: validatedData.streamType,
        streamUrl: validatedData.streamUrl,
        scheduledStart: start,
        scheduledEnd: end,
        status: start === null && end === null ? 'LIVE' : 'SCHEDULED',
        actualStart: start === null && end === null ? new Date() : null,
      },
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
      },
    })

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'RADIO_SESSION_CREATED',
        entityType: 'RadioSession',
        entityId: session.id,
        details: JSON.stringify({
          title: session.title,
          scheduledStart: session.scheduledStart,
          scheduledEnd: session.scheduledEnd,
          streamType: session.streamType,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error al crear sesión de radio:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión de radio' },
      { status: 500 }
    )
  }
}
