import { z } from 'zod'

// ============================================
// User Management Schemas
// ============================================

export const updateUserRankSchema = z.object({
  rankId: z.number().int().min(1).max(10),
  reason: z.string().min(10, 'La razón debe tener al menos 10 caracteres'),
})

export const updateSovereignSchema = z.object({
  isSovereign: z.boolean(),
  reason: z.string().min(10, 'La razón debe tener al menos 10 caracteres'),
})

export const deleteUserSchema = z.object({
  reason: z.string().min(10, 'La razón de eliminación debe tener al menos 10 caracteres'),
})

// ============================================
// Promotion Request Schemas
// ============================================

export const createPromotionRequestSchema = z.object({
  subjectUserId: z.string().uuid('ID de usuario inválido'),
  targetRankId: z.number().int().min(1).max(10),
  justification: z.string().min(20, 'La justificación debe tener al menos 20 caracteres'),
})

export const reviewPromotionRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().min(10, 'Las notas de revisión deben tener al menos 10 caracteres'),
})

// ============================================
// Query Parameter Schemas
// ============================================

export const userListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  rankId: z.string().optional(),
  isSovereign: z.string().optional(),
})

export const promotionRequestListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  targetRankId: z.string().optional(),
  subjectUserId: z.string().optional(),
  requestedById: z.string().optional(),
})

export const auditLogQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

// ============================================
// Type exports
// ============================================

export type UpdateUserRankInput = z.infer<typeof updateUserRankSchema>
export type UpdateSovereignInput = z.infer<typeof updateSovereignSchema>
export type DeleteUserInput = z.infer<typeof deleteUserSchema>
export type CreatePromotionRequestInput = z.infer<typeof createPromotionRequestSchema>
export type ReviewPromotionRequestInput = z.infer<typeof reviewPromotionRequestSchema>
