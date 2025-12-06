import { z } from 'zod'

// ============================================
// Schema para actualización de perfil
// ============================================
export const updateProfileSchema = z.object({
  habboName: z
    .string()
    .min(3, 'El nombre debe tener mínimo 3 caracteres')
    .max(25, 'El nombre debe tener máximo 25 caracteres')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Solo se permiten letras, números, puntos, guiones y guiones bajos'
    )
    .optional(),
})

// ============================================
// Schema para cambio de contraseña
// ============================================
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener mínimo 8 caracteres')
      .max(100, 'La contraseña es demasiado larga'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

// ============================================
// Tipos TypeScript exportados
// ============================================
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
