import jwt from 'jsonwebtoken'

export interface WsTokenPayload {
  userId: string
  habboName: string
}

interface JwtPayload extends WsTokenPayload {
  iat: number
  exp: number
}

/**
 * Genera un token JWT para autenticación WebSocket
 * @param payload - Datos del usuario (userId, habboName)
 * @returns Token JWT firmado
 */
export function generateWsToken(payload: WsTokenPayload): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured in environment variables')
  }

  return jwt.sign(
    {
      userId: payload.userId,
      habboName: payload.habboName,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '24h', // Token válido por 24 horas
      algorithm: 'HS256',
    }
  )
}

/**
 * Verifica y decodifica un token JWT
 * @param token - Token JWT a verificar
 * @returns Payload decodificado o null si inválido
 */
export function verifyWsToken(token: string): WsTokenPayload | null {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured in environment variables')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload

    return {
      userId: decoded.userId,
      habboName: decoded.habboName,
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('[WS Auth] Token verification failed:', error.message)
    }
    return null
  }
}

/**
 * Decodifica un token sin verificar (útil para debugging)
 * @param token - Token JWT
 * @returns Payload decodificado o null
 */
export function decodeWsToken(token: string): (WsTokenPayload & { exp: number; iat: number }) | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null
    return decoded
  } catch (error) {
    console.error('[WS Auth] Token decode failed:', error)
    return null
  }
}
