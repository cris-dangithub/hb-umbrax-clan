import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/session'

// ============================================
// POST /api/auth/logout
// Cierra la sesión del usuario actual
// ============================================
export async function POST(request: NextRequest) {
  try {
    await destroySession()

    // Obtener la URL base y redirigir al home
    const origin = request.headers.get('origin') || 'http://localhost:3001'
    return NextResponse.redirect(new URL('/', origin), 303)
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      {
        error: 'Error al cerrar sesión',
      },
      { status: 500 }
    )
  }
}
