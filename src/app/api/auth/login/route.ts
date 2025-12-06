import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/schemas/auth'
import { verifyPassword } from '@/lib/auth'
import { createSession } from '@/lib/session'

// ============================================
// POST /api/auth/login
// Inicia sesión de un usuario existente
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos con Zod
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { habboName, password } = validation.data

    // Normalizar nombre para búsqueda case-insensitive
    const habboNameLower = habboName.toLowerCase()

    // ============================================
    // 1. Buscar usuario en la base de datos (case-insensitive)
    // ============================================
    const user = await prisma.user.findUnique({
      where: { habboNameLower },
      include: {
        rank: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          error: 'Usuario o contraseña incorrectos',
        },
        { status: 401 }
      )
    }

    // ============================================
    // 2. Verificar contraseña
    // ============================================
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: 'Usuario o contraseña incorrectos',
        },
        { status: 401 }
      )
    }

    // ============================================
    // 3. Actualizar IP en el login (opcional)
    // ============================================
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown'

    await prisma.user.update({
      where: { id: user.id },
      data: { ipAddress }, // Actualizar última IP conocida
    })

    // ============================================
    // 4. Crear sesión (permanente si rememberMe)
    // ============================================
    await createSession(user.id, user.habboName)

    // ============================================
    // 5. Responder con éxito (sin incluir password)
    // ============================================
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: '¡Bienvenido de vuelta a UMBRAX CLAN!',
        user: userWithoutPassword,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor. Por favor intenta nuevamente.',
      },
      { status: 500 }
    )
  }
}
