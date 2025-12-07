import { z } from 'zod'

// ============================================
// Schema de Registro
// ============================================
export const registerSchema = z
  .object({
    habboName: z
      .string()
      .min(3, 'El nombre debe tener mínimo 3 caracteres')
      .max(25, 'El nombre debe tener máximo 25 caracteres')
      .regex(
        /^[a-zA-Z0-9._:-]+$/,
        'Solo se permiten letras, números, puntos, guiones, guiones bajos y dos puntos'
      ),
    password: z
      .string()
      .min(8, 'La contraseña debe tener mínimo 8 caracteres')
      .max(100, 'La contraseña es demasiado larga'),
    passwordConfirm: z.string(),
    privacyConsent: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Debes aceptar la política de privacidad para continuar',
      }),
    rememberMe: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirm'],
  })

// ============================================
// Schema de Inicio de Sesión
// ============================================
export const loginSchema = z.object({
  habboName: z
    .string()
    .min(1, 'El nombre de usuario es requerido')
    .max(25, 'El nombre de usuario es inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional().default(false),
})

// ============================================
// Tipos TypeScript exportados
// ============================================
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
