import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

interface CreateAuditLogParams {
  userId: string
  action: AuditAction
  entityType: string
  entityId: string
  details: Record<string, unknown>
  ipAddress?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: JSON.stringify(details),
        ipAddress,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit failures shouldn't break the main flow
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Get audit logs with filters and pagination
 */
export interface GetAuditLogsParams {
  page?: number
  limit?: number
  userId?: string
  action?: AuditAction
  entityType?: string
  startDate?: Date
  endDate?: Date
}

export async function getAuditLogs({
  page = 1,
  limit = 50,
  userId,
  action,
  entityType,
  startDate,
  endDate,
}: GetAuditLogsParams) {
  const skip = (page - 1) * limit

  const where: {
    userId?: string
    action?: AuditAction
    entityType?: string
    createdAt?: {
      gte?: Date
      lte?: Date
    }
  } = {}

  if (userId) {
    where.userId = userId
  }

  if (action) {
    where.action = action
  }

  if (entityType) {
    where.entityType = entityType
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
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
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs: logs.map((log) => ({
      ...log,
      details: JSON.parse(log.details) as Record<string, unknown>,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
