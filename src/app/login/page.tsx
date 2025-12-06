'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    habboName: '',
    password: '',
    rememberMe: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [habboAvatar, setHabboAvatar] = useState<string | null>(null)

  // Preview del avatar
  const handleHabboNameBlur = () => {
    if (formData.habboName.length >= 3) {
      const avatarUrl = `https://www.habbo.es/habbo-imaging/avatarimage?user=${encodeURIComponent(
        formData.habboName
      )}&head_direction=3&size=l&action=wav`
      setHabboAvatar(avatarUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {}
          Object.entries(data.details).forEach(([key, value]) => {
            fieldErrors[key] = (value as string[])[0]
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ general: data.error })
        }
        return
      }

      // Login exitoso
      router.push('/dashboard')
    } catch {
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Contenedor principal con glassmorphism */}
      <div className="w-full max-w-md">
        <div
          className="backdrop-blur-md rounded-lg shadow-2xl p-8"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.8)',
            border: '2px solid #CC933B',
          }}
        >
          {/* Logo/Título */}
          <h1
            className="text-center text-2xl mb-8"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
            }}
          >
            UMBRAX CLAN
          </h1>

          {/* Avatar Preview */}
          {habboAvatar && (
            <div className="flex justify-center mb-6">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: 'rgba(74, 12, 17, 0.3)',
                  border: '1px solid #CC933B',
                }}
              >
                <Image src={habboAvatar} alt="Avatar Habbo" width={64} height={110} />
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error general */}
            {errors.general && (
              <div
                className="p-3 rounded text-center text-sm"
                style={{ backgroundColor: '#4A0C11', color: '#CC933B' }}
              >
                {errors.general}
              </div>
            )}

            {/* Habbo Name */}
            <div>
              <label
                className="block text-sm mb-2"
                style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
              >
                Nombre de Usuario en Habbo
              </label>
              <input
                type="text"
                value={formData.habboName}
                onChange={(e) =>
                  setFormData({ ...formData, habboName: e.target.value })
                }
                onBlur={handleHabboNameBlur}
                className="w-full px-4 py-2 rounded bg-black/50 text-white"
                style={{ border: '1px solid #CC933B', fontFamily: 'Rajdhani, sans-serif' }}
                disabled={isLoading}
              />
              {errors.habboName && (
                <p className="text-xs mt-1" style={{ color: '#CC933B' }}>
                  {errors.habboName}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm mb-2"
                style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 rounded bg-black/50 text-white"
                style={{ border: '1px solid #CC933B', fontFamily: 'Rajdhani, sans-serif' }}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: '#CC933B' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={formData.rememberMe}
                onChange={(e) =>
                  setFormData({ ...formData, rememberMe: e.target.checked })
                }
                disabled={isLoading}
              />
              <label
                htmlFor="remember"
                className="text-sm"
                style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
              >
                Mantener sesión iniciada
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded font-bold text-black transition-all hover:scale-105"
              style={{
                backgroundColor: '#CC933B',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '18px',
                border: '2px solid #CC933B',
              }}
            >
              {isLoading ? 'ENTRANDO...' : 'ENTRAR AL CLAN'}
            </button>
          </form>

          {/* Link a Registro */}
          <p
            className="text-center mt-6 text-sm"
            style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
          >
            ¿Nuevo en NOVAX?{' '}
            <Link href="/register" className="underline hover:text-white">
              Únete ahora
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
