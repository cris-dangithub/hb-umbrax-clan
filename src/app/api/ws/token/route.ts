import { getCurrentUser } from '@/lib/get-current-user'
import { generateWsToken } from '@/lib/websocket-auth'
import { NextResponse } from 'next/server'

/**
 * Endpoint para obtener token WebSocket
 * GET /api/ws/token
 * 
 * Requiere autenticación (iron-session)
 * Retorna JWT token válido por 24 horas para conectarse al servidor WebSocket
 */
export async function GET() {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generar token WebSocket
    const token = generateWsToken({
      userId: user.id,
      habboName: user.habboName,
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('[API /ws/token] Error generating token:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
