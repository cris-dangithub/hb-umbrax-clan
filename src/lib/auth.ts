import bcrypt from 'bcryptjs'

// ============================================
// Utilidades de Hash de Contraseñas
// ============================================

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Contraseña hasheada
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verifica una contraseña contra su hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado en la base de datos
 * @returns true si coinciden, false si no
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ============================================
// Validación de Usuario en Habbo Hotel
// ============================================

export interface HabboValidationResult {
  isValid: boolean
  exactName?: string // Nombre con capitalización exacta de Habbo
  avatarUrl?: string
  figureString?: string
  error?: string
}

export interface HabboApiResponse {
  uniqueId: string
  name: string // Nombre con capitalización exacta
  figureString: string
  motto: string
  online: boolean
  lastAccessTime: string
  memberSince: string
  profileVisible: boolean
  currentLevel?: number
  currentLevelCompletePercent?: number
  totalExperience?: number
  starGemCount?: number
  selectedBadges?: Array<{
    badgeIndex: number
    code: string
    name: string
    description: string
  }>
}

/**
 * Valida que un usuario existe en Habbo Hotel usando la API pública oficial
 * Obtiene el nombre con capitalización EXACTA del usuario
 * @param habboName - Nombre de usuario en Habbo (acepta cualquier capitalización)
 * @returns Resultado de validación con nombre exacto y avatarUrl
 */
export async function validateHabboUser(
  habboName: string
): Promise<HabboValidationResult> {
  try {
    // API pública de Habbo que devuelve el nombre EXACTO
    const apiUrl = `https://www.habbo.es/api/public/users?name=${encodeURIComponent(
      habboName
    )}`

    // Configurar timeout de 10 segundos para evitar colgarse
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'NOVAX-CLAN-Platform/1.0',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Si es 404, el usuario no existe
    if (response.status === 404) {
      return {
        isValid: false,
        error: 'Usuario no encontrado en Habbo Hotel',
      }
    }

    // Otros errores HTTP
    if (!response.ok) {
      return {
        isValid: false,
        error: 'Error al verificar el usuario en Habbo Hotel',
      }
    }

    // Parsear respuesta JSON
    const data: HabboApiResponse = await response.json()

    // Verificar si el perfil es visible (opcional: podemos permitir perfiles ocultos)
    if (!data.profileVisible) {
      return {
        isValid: false,
        error: 'El perfil de este usuario no es público en Habbo Hotel',
      }
    }

    // Construir URL del avatar usando el nombre exacto
    const avatarUrl = `https://www.habbo.es/habbo-imaging/avatarimage?user=${encodeURIComponent(
      data.name
    )}&head_direction=3&size=l&action=wav`

    return {
      isValid: true,
      exactName: data.name, // Nombre con capitalización exacta
      avatarUrl,
      figureString: data.figureString,
    }
  } catch (error) {
    console.error('Error validando usuario Habbo:', error)
    
    // Diferenciar entre timeout y otros errores
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          isValid: false,
          error: 'La validación con Habbo Hotel tardó demasiado. Intenta nuevamente.',
        }
      }
    }
    
    return {
      isValid: false,
      error: 'No se pudo conectar con los servidores de Habbo Hotel',
    }
  }
}

/**
 * Obtiene la URL completa del avatar de Habbo
 * @param habboName - Nombre de usuario en Habbo
 * @param size - Tamaño del avatar (s, m, l)
 * @param direction - Dirección de la cabeza (0-7)
 * @returns URL del avatar
 */
export function getHabboAvatarUrl(
  habboName: string,
  size: 's' | 'm' | 'l' = 'l',
  direction: number = 3,
  action: string = 'wav'
): string {
  return `https://www.habbo.es/habbo-imaging/avatarimage?user=${encodeURIComponent(
    habboName
  )}&head_direction=${direction}&size=${size}&action=${action}`
}
