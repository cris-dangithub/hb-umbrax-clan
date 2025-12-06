'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import HabboAvatar from './HabboAvatar'
import Modal from './Modal'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister?: () => void
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [formData, setFormData] = useState({
    habboName: '',
    password: '',
    rememberMe: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
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

      // Login exitoso - mostrar pantalla de éxito
      setIsSuccess(true)
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 800)
    } catch {
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={isSuccess ? () => {} : onClose} title="INICIAR SESIÓN">
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-16 h-16 animate-spin" style={{ color: "#CC933B" }} />
          <p className="text-xl font-bold" style={{ fontFamily: "Rajdhani, sans-serif", color: "#CC933B" }}>
            ✅ Inicio de sesión exitoso
          </p>
          <p className="text-sm" style={{ fontFamily: "Rajdhani, sans-serif", color: "#CC933B" }}>
            Redirigiendo a tu cuenta...
          </p>
        </div>
      ) : (
        <>
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
            <HabboAvatar src={habboAvatar} alt="Avatar Habbo" size={110} />
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
          className="w-full py-3 rounded font-bold text-black transition-all hover:scale-105 cursor-pointer disabled:cursor-not-allowed"
          style={{
            backgroundColor: isLoading ? 'rgba(204, 147, 59, 0.5)' : '#CC933B',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '18px',
            border: '2px solid #CC933B',
            opacity: isLoading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>ENTRANDO...</span>
            </>
          ) : (
            <span>ENTRAR AL CLAN</span>
          )}
        </button>
      </form>

      {/* Link a Registro */}
      <p
        className="text-center mt-6 text-sm"
        style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
      >
        ¿Nuevo en NOVAX?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="underline hover:text-white"
        >
          Únete ahora
        </button>
      </p>
      </>
      )}
    </Modal>
  )
}
