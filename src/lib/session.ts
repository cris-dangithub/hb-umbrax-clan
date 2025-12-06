import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

// ============================================
// Interfaz de Datos de Sesión
// ============================================
export interface SessionData {
  userId: string
  habboName: string
  isLoggedIn: boolean
}

// ============================================
// Configuración de Iron Session
// ============================================
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'novax_session',
  ttl: 0, // 0 = sesión permanente hasta logout manual
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  },
}

// ============================================
// Helper para obtener la sesión actual
// ============================================
export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

// ============================================
// Helper para crear una sesión de usuario
// ============================================
export async function createSession(userId: string, habboName: string) {
  const session = await getSession()
  session.userId = userId
  session.habboName = habboName
  session.isLoggedIn = true
  await session.save()
}

// ============================================
// Helper para destruir la sesión
// ============================================
export async function destroySession() {
  const session = await getSession()
  session.destroy()
}

// ============================================
// Helper para verificar si hay sesión activa
// ============================================
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session.isLoggedIn === true && !!session.userId
}
