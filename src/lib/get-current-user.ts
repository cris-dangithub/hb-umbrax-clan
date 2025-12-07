import { prisma } from './prisma'
import { getSession } from './session'
import type { User, Rank } from '@prisma/client'
import { hasAdminPermissions, isCupula, getUserRole, UserRole } from './roles'

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
    // Solo logear errores reales de BD, no los de cookies durante build
    if (process.env.NODE_ENV !== 'production' || (error as Error).message?.includes('prisma')) {
      console.error('Error obteniendo usuario actual:', error)
    }
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
// (Actualizados para usar sistema de roles centralizado)
// ============================================

/**
 * Verifica si el usuario tiene acceso total (Cúpula Directiva)
 * @deprecated Use isCupula from roles.ts instead
 */
export async function hasFullAccess(): Promise<boolean> {
  const user = await getCurrentUser()
  return isCupula(user)
}

/**
 * Verifica si el usuario es Soberano
 * @deprecated Check getUserRole(user) === UserRole.SOBERANO instead
 */
export async function isSovereign(): Promise<boolean> {
  const user = await getCurrentUser()
  return getUserRole(user) === UserRole.SOBERANO
}

/**
 * Verifica si el usuario tiene acceso al panel administrativo
 * (Cúpula Directiva o Soberano)
 */
export async function hasAdminAccess(): Promise<boolean> {
  const user = await getCurrentUser()
  return hasAdminPermissions(user)
}

/**
 * Verifica si el usuario puede aprobar un ascenso a un rango específico
 * @param targetRankOrder - Orden del rango objetivo
 */
export async function canApprovePromotionToRank(targetRankOrder: number): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const role = getUserRole(user)
  
  // Cúpula directiva puede aprobar todo
  if (role === UserRole.CUPULA) return true

  // Soberano solo puede aprobar su propio rango
  if (role === UserRole.SOBERANO && user.rank.order === targetRankOrder) return true

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
 * Verifica si un usuario es súbdito (rangos 4-13 sin privilegios de soberano)
 * @param rankOrder - Orden del rango a verificar
 * @deprecated This should be checked via getUserRole instead
 */
export function isSubordinate(rankOrder: number): boolean {
  // Rangos 4-13 son potencialmente súbditos (si no son soberanos)
  return rankOrder >= 4 && rankOrder <= 13
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
      role: UserRole.GUEST,
    }
  }

  const role = getUserRole(user)
  const fullAccess = role === UserRole.CUPULA
  const sovereign = role === UserRole.SOBERANO
  const adminAccess = hasAdminPermissions(user)

  // Si tiene acceso total, puede aprobar todos los rangos
  // Si es soberano, solo puede aprobar su rango
  const approvableRanks = fullAccess
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
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
    role,
  }
}
