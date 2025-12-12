/**
 * Sistema centralizado de roles para control de permisos
 * 
 * ROLES DEL SISTEMA:
 * - CUPULA: Rangos 1-3 (Gran Líder, Sombra Suprema, Ingeniero Abisal)
 * - SOBERANO: Usuarios con isSovereign=true en rangos 4-12
 * - SUBDITO: Rangos 4-13 sin privilegios de soberano
 * - GUEST: Usuario no autenticado
 */

import type { UserWithRank } from './get-current-user'

/**
 * Enum de roles del sistema
 */
export enum UserRole {
  CUPULA = 'CUPULA',
  SOBERANO = 'SOBERANO',
  SUBDITO = 'SUBDITO',
  GUEST = 'GUEST'
}

/**
 * Configuración de rangos que pertenecen a la Cúpula Directiva
 * Actualmente: rangos 1-3
 */
const CUPULA_RANK_ORDERS = [1, 2, 3]

/**
 * Determina el rol de un usuario basándose en su rango y estado de soberano
 * 
 * @param user - Usuario con información de rango (puede ser null/undefined para guests)
 * @returns Rol del usuario
 * 
 * @example
 * const role = getUserRole(user)
 * if (role === UserRole.CUPULA) {
 *   // Usuario tiene permisos de cúpula
 * }
 */
export function getUserRole(user?: UserWithRank | null): UserRole {
  if (!user) {
    return UserRole.GUEST
  }

  // Cúpula Directiva: rangos 1-3
  if (user.rank && CUPULA_RANK_ORDERS.includes(user.rank.order)) {
    return UserRole.CUPULA
  }

  // Soberanos: usuarios con privilegios especiales en rangos 4-12
  if (user.isSovereign) {
    return UserRole.SOBERANO
  }

  // Súbditos: resto de usuarios autenticados
  return UserRole.SUBDITO
}

/**
 * Verifica si un usuario tiene permisos de administración
 * Los roles con permisos admin son: CUPULA y SOBERANO
 * 
 * @param user - Usuario a verificar
 * @returns true si tiene permisos de admin, false en caso contrario
 * 
 * @example
 * if (hasAdminPermissions(user)) {
 *   // Mostrar panel de administración
 * }
 */
export function hasAdminPermissions(user?: UserWithRank | null): boolean {
  const role = getUserRole(user)
  return role === UserRole.CUPULA || role === UserRole.SOBERANO
}

/**
 * Verifica si un usuario es miembro de la Cúpula Directiva
 * 
 * @param user - Usuario a verificar
 * @returns true si es Cúpula, false en caso contrario
 */
export function isCupula(user?: UserWithRank | null): boolean {
  return getUserRole(user) === UserRole.CUPULA
}

/**
 * Verifica si un usuario es Soberano
 * 
 * @param user - Usuario a verificar
 * @returns true si es Soberano, false en caso contrario
 */
export function isSoberano(user?: UserWithRank | null): boolean {
  return getUserRole(user) === UserRole.SOBERANO
}

/**
 * Verifica si un usuario es Súbdito
 * 
 * @param user - Usuario a verificar
 * @returns true si es Súbdito, false en caso contrario
 */
export function isSubdito(user?: UserWithRank | null): boolean {
  return getUserRole(user) === UserRole.SUBDITO
}

/**
 * Verifica si un usuario está autenticado (cualquier rol excepto GUEST)
 * 
 * @param user - Usuario a verificar
 * @returns true si está autenticado, false en caso contrario
 */
export function isAuthenticated(user?: UserWithRank | null): boolean {
  return getUserRole(user) !== UserRole.GUEST
}

/**
 * Verifica si un usuario es DJ (tiene permisos para gestionar la radio)
 * 
 * @param user - Usuario a verificar
 * @returns true si es DJ, false en caso contrario
 */
export function isDJ(user?: UserWithRank | null): boolean {
  return user?.isDJ ?? false
}

/**
 * Verifica si un usuario tiene permisos de DJ o es Cúpula
 * La Cúpula tiene acceso completo al sistema de radio
 * 
 * @param user - Usuario a verificar
 * @returns true si puede gestionar la radio
 */
export function canManageRadio(user?: UserWithRank | null): boolean {
  return isCupula(user) || isDJ(user)
}

/**
 * Obtiene un nombre legible del rol
 * 
 * @param role - Rol a convertir
 * @returns Nombre legible del rol
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.CUPULA]: 'Cúpula Directiva',
    [UserRole.SOBERANO]: 'Soberano',
    [UserRole.SUBDITO]: 'Súbdito',
    [UserRole.GUEST]: 'Invitado'
  }
  return displayNames[role]
}

/**
 * Obtiene el nombre legible del rol de un usuario
 * 
 * @param user - Usuario
 * @returns Nombre legible del rol del usuario
 */
export function getUserRoleDisplayName(user?: UserWithRank | null): string {
  return getRoleDisplayName(getUserRole(user))
}

/**
 * Verifica si un rol tiene permisos para realizar una acción específica
 * 
 * @param user - Usuario a verificar
 * @param action - Acción a verificar
 * @returns true si el usuario puede realizar la acción
 */
export type PermissionAction = 
  | 'view_admin_panel'
  | 'manage_users'
  | 'manage_promotions'
  | 'manage_time_tracking'
  | 'view_audit_logs'
  | 'assign_sovereign'
  | 'create_news'
  | 'create_events'
  | 'create_radio_session'
  | 'start_radio_session'
  | 'end_radio_session'
  | 'manage_playlist'
  | 'moderate_song_requests'
  | 'assign_dj_role'
  | 'view_radio_analytics'

export function can(user: UserWithRank | null | undefined, action: PermissionAction): boolean {
  const role = getUserRole(user)
  const isUserDJ = isDJ(user)

  // Permisos por acción
  const permissions: Record<PermissionAction, UserRole[]> = {
    view_admin_panel: [UserRole.CUPULA, UserRole.SOBERANO],
    manage_users: [UserRole.CUPULA, UserRole.SOBERANO],
    manage_promotions: [UserRole.CUPULA, UserRole.SOBERANO],
    manage_time_tracking: [UserRole.CUPULA, UserRole.SOBERANO],
    view_audit_logs: [UserRole.CUPULA, UserRole.SOBERANO],
    assign_sovereign: [UserRole.CUPULA], // Solo Cúpula puede asignar soberanos
    create_news: [UserRole.CUPULA, UserRole.SOBERANO],
    create_events: [UserRole.CUPULA, UserRole.SOBERANO],
    // Permisos de radio: Cúpula siempre tiene acceso, DJs tienen acceso según su rol
    create_radio_session: [UserRole.CUPULA], // Solo Cúpula y DJs pueden crear sesiones
    start_radio_session: [UserRole.CUPULA], // Solo Cúpula y DJs pueden iniciar
    end_radio_session: [UserRole.CUPULA], // Solo Cúpula y DJs pueden finalizar
    manage_playlist: [UserRole.CUPULA], // Solo Cúpula y DJs pueden gestionar playlist
    moderate_song_requests: [UserRole.CUPULA], // Solo Cúpula y DJs pueden moderar
    assign_dj_role: [UserRole.CUPULA], // Solo Cúpula puede asignar rol DJ
    view_radio_analytics: [UserRole.CUPULA] // Solo Cúpula puede ver analytics
  }

  // Cúpula siempre tiene acceso a todo
  if (role === UserRole.CUPULA) {
    return true
  }

  // DJs tienen acceso especial a acciones de radio (excepto assign_dj_role y view_radio_analytics)
  if (isUserDJ && [
    'create_radio_session',
    'start_radio_session', 
    'end_radio_session',
    'manage_playlist',
    'moderate_song_requests'
  ].includes(action)) {
    return true
  }

  return permissions[action]?.includes(role) ?? false
}
