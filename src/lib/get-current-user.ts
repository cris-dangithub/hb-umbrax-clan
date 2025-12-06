import { prisma } from './prisma'
import { getSession } from './session'
import type { User, Rank } from '@prisma/client'

// ============================================
// Tipo de Usuario con Rango incluido
// ============================================
export type UserWithRank = User & {
  rank: Rank
}

// ============================================
// Obtener usuario actual desde la sesión
// ============================================
/**
 * Obtiene los datos completos del usuario actual desde la sesión
 * Incluye información del rango para control de acceso
 * @returns Usuario con rango o null si no hay sesión
 */
export async function getCurrentUser(): Promise<UserWithRank | null> {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || !session.userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      include: {
        rank: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return null
  }
}

// ============================================
// Helper para verificar permisos por rango
// ============================================
/**
 * Verifica si el usuario actual tiene un rango igual o superior al especificado
 * @param requiredOrder - Orden del rango requerido (1 = más alto, 10 = más bajo)
 * @returns true si tiene permisos, false si no
 */
export async function hasRankPermission(requiredOrder: number): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }

  // Si el order del usuario es menor o igual, tiene permiso
  // (Recordar: 1 = más alto, 10 = más bajo)
  return user.rank.order <= requiredOrder
}

// ============================================
// Helpers para Panel Administrativo
// ============================================

/**
 * Verifica si el usuario tiene acceso total (Cúpula Directiva - rangos 1, 2, 3)
 */
export async function hasFullAccess(): Promise<boolean> {
  const user = await getCurrentUser()
  return user ? user.rank.order <= 3 : false
}

/**
 * Verifica si el usuario es Soberano
 */
export async function isSovereign(): Promise<boolean> {
  const user = await getCurrentUser()
  return user ? user.isSovereign : false
}

/**
 * Verifica si el usuario tiene acceso al panel administrativo
 * (Cúpula Directiva o Soberano)
 */
export async function hasAdminAccess(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return user.rank.order <= 3 || user.isSovereign
}

/**
 * Verifica si el usuario puede aprobar un ascenso a un rango específico
 * @param targetRankOrder - Orden del rango objetivo
 */
export async function canApprovePromotionToRank(targetRankOrder: number): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Cúpula directiva puede aprobar todo
  if (user.rank.order <= 3) return true

  // Soberano solo puede aprobar su propio rango
  if (user.isSovereign && user.rank.order === targetRankOrder) return true

  return false
}

/**
 * Verifica si el usuario puede crear solicitudes de ascenso
 * (Cúpula Directiva o Soberano)
 */
export async function canCreatePromotionRequest(): Promise<boolean> {
  return hasAdminAccess()
}

/**
 * Verifica si un usuario es súbdito (rangos 5-10)
 * @param rankOrder - Orden del rango a verificar
 */
export function isSubordinate(rankOrder: number): boolean {
  return rankOrder >= 5 && rankOrder <= 10
}

/**
 * Obtiene información de permisos del usuario actual
 */
export async function getCurrentUserPermissions() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      hasFullAccess: false,
      isSovereign: false,
      hasAdminAccess: false,
      canCreatePromotions: false,
      approvableRanks: [] as number[],
    }
  }

  const fullAccess = user.rank.order <= 3
  const sovereign = user.isSovereign
  const adminAccess = fullAccess || sovereign

  // Si tiene acceso total, puede aprobar todos los rangos
  // Si es soberano, solo puede aprobar su rango
  const approvableRanks = fullAccess
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    : sovereign
      ? [user.rank.order]
      : []

  return {
    hasFullAccess: fullAccess,
    isSovereign: sovereign,
    hasAdminAccess: adminAccess,
    canCreatePromotions: adminAccess,
    approvableRanks,
    userRankOrder: user.rank.order,
  }
}
