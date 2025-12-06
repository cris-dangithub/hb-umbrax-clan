import { NextRequest, NextResponse } from 'next/server'
import { hasFullAccess } from '@/lib/get-current-user'
import { getAuditLogs } from '@/lib/audit'
import { parsePaginationParams, parseSearchParam } from '@/lib/pagination'
import { AuditAction } from '@prisma/client'

/**
 * GET /api/admin/audit-logs
 * Obtiene logs de auditoría con filtros
 * Solo accesible por Cúpula Directiva (rangos 1-3)
 */
export async function GET(request: NextRequest) {
  try {
    const fullAccess = await hasFullAccess()
    if (!fullAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const { page, limit } = parsePaginationParams(searchParams, 50, 100)
    const userId = searchParams.get('userId') || undefined
    const actionParam = searchParams.get('action')
    const entityType = parseSearchParam(searchParams) || undefined
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const action =
      actionParam && Object.values(AuditAction).includes(actionParam as AuditAction)
        ? (actionParam as AuditAction)
        : undefined

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const result = await getAuditLogs({
      page,
      limit,
      userId,
      action,
      entityType,
      startDate,
      endDate,
    })

    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
