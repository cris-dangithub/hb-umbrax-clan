import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasAdminAccess } from '@/lib/get-current-user'
import {
  parsePaginationParams,
  parseSearchParam,
  parseIntParam,
  parseBooleanParam,
  getSkipValue,
  buildPaginatedResponse,
} from '@/lib/pagination'

/**
 * GET /api/admin/users
 * Lista todos los usuarios con filtros y paginación
 * Accesible por Cúpula Directiva (rangos 1-3) y Soberanos
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos administrativos (Cúpula o Soberano)
    const adminAccess = await hasAdminAccess()
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      )
    }

    // Parsear parámetros de la URL
    const { searchParams } = new URL(request.url)
    const { page, limit } = parsePaginationParams(searchParams, 20, 50)
    const search = parseSearchParam(searchParams)
    const rankId = parseIntParam(searchParams, 'rankId')
    const isSovereign = parseBooleanParam(searchParams, 'isSovereign')

    // Construir filtros
    const where: {
      rankId?: number
      isSovereign?: boolean
      OR?: Array<{
        habboName?: { contains: string; mode: 'insensitive' }
        habboNameLower?: { contains: string }
      }>
    } = {}

    if (rankId) {
      where.rankId = rankId
    }

    if (isSovereign !== undefined) {
      where.isSovereign = isSovereign
    }

    if (search) {
      where.OR = [
        { habboName: { contains: search, mode: 'insensitive' } },
        { habboNameLower: { contains: search.toLowerCase() } },
      ]
    }

    // Obtener usuarios y total
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: getSkipValue(page, limit),
        take: limit,
        orderBy: [{ rank: { order: 'asc' } }, { habboName: 'asc' }],
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
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(users, page, limit, total))
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
