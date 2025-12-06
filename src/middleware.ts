import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './lib/session'

// ============================================
// Middleware para proteger rutas
// ============================================
export async function middleware(request: NextRequest) {
  const session = await getSession()

  // Si no hay sesión activa, redirigir a home con modal de login
  if (!session.isLoggedIn || !session.userId) {
    const homeUrl = new URL('/', request.url)
    // Abrir modal de login automáticamente
    homeUrl.searchParams.set('modal', 'login')
    // Guardar la URL a la que intentaba acceder para redirección posterior
    homeUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
    return NextResponse.redirect(homeUrl)
  }

  // Si hay sesión, permitir el acceso
  return NextResponse.next()
}

// ============================================
// Configuración de rutas protegidas
// ============================================
export const config = {
  matcher: [
    /*
     * Proteger rutas de dashboard y admin
     * /dashboard: Requiere autenticación
     * /admin: Requiere autenticación (validación de permisos en las páginas)
     */
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}
