import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/schemas/auth'
import { hashPassword, validateHabboUser } from '@/lib/auth'
import { createSession } from '@/lib/session'

// ============================================
// POST /api/auth/register
// Registra un nuevo usuario en UMBRAX CLAN
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos con Zod
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { habboName, password, rememberMe } = validation.data

    // ============================================
    // 1. Validar usuario en Habbo Hotel (OBLIGATORIO)
    // ============================================
    const habboValidation = await validateHabboUser(habboName)

    if (!habboValidation.isValid) {
      return NextResponse.json(
        {
          error: habboValidation.error || 'El usuario no existe en Habbo Hotel',
          field: 'habboName',
        },
        { status: 400 }
      )
    }

    // Obtener nombre EXACTO con capitalización correcta de Habbo
    const exactHabboName = habboValidation.exactName!
    const habboNameLower = exactHabboName.toLowerCase()

    // ============================================
    // 2. Verificar que el nombre no esté registrado (case-insensitive)
    // ============================================
    const existingUser = await prisma.user.findUnique({
      where: { habboNameLower },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Este nombre de usuario ya está registrado en UMBRAX CLAN',
          field: 'habboName',
        },
        { status: 409 }
      )
    }

    // ============================================
    // 3. Capturar dirección IP del registro
    // ============================================
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown'

    // ============================================
    // 4. Hashear contraseña
    // ============================================
    const hashedPassword = await hashPassword(password)

    // ============================================
    // 5. Crear usuario en la base de datos
    // ============================================
    const newUser = await prisma.user.create({
      data: {
        habboName: exactHabboName, // Nombre con capitalización exacta de Habbo
        habboNameLower, // Nombre en minúsculas para unicidad
        password: hashedPassword,
        ipAddress,
        avatarUrl: habboValidation.avatarUrl!,
        rankId: 13, // Sombra Aprendiz por defecto (rango más bajo)
      },
      include: {
        rank: true,
      },
    })

    // ============================================
    // 6. Crear sesión si "Recordarme" está activado
    // ============================================
    if (rememberMe) {
      await createSession(newUser.id, newUser.habboName)
    }

    // ============================================
    // 7. Responder con éxito (sin incluir password)
    // ============================================
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(
      {
        message: '¡Bienvenido a UMBRAX CLAN! Tu cuenta ha sido creada exitosamente.',
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor. Por favor intenta nuevamente.',
      },
      { status: 500 }
    )
  }
}
