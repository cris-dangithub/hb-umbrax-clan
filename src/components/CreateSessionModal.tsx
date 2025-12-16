'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from './Modal'

interface CreateSessionModalProps {
  isOpen: boolean
  onSubmit: (data: CreateSessionData) => Promise<void>
  onClose: () => void
}

interface CreateSessionData {
  title: string
  description?: string
  streamType: 'YOUTUBE' | 'TWITCH' | 'ICECAST' | 'CUSTOM'
  streamUrl: string
  scheduledStart?: string
  scheduledEnd?: string
}

export default function CreateSessionModal({ isOpen, onSubmit, onClose }: CreateSessionModalProps) {
  const [formData, setFormData] = useState<CreateSessionData>({
    title: '',
    description: '',
    streamType: 'YOUTUBE',
    streamUrl: '',
    scheduledStart: '',
    scheduledEnd: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Filtrar campos vacíos de fechas
      const payload: CreateSessionData = {
        title: formData.title,
        description: formData.description,
        streamType: formData.streamType,
        streamUrl: formData.streamUrl,
      }

      // Solo agregar fechas si tienen valor
      if (formData.scheduledStart && formData.scheduledStart.trim()) {
        payload.scheduledStart = formData.scheduledStart
      }
      if (formData.scheduledEnd && formData.scheduledEnd.trim()) {
        payload.scheduledEnd = formData.scheduledEnd
      }

      await onSubmit(payload)
      
      // Mostrar éxito y cerrar
      setIsSuccess(true)
      setTimeout(() => {
        onClose()
        // Reset form
        setFormData({
          title: '',
          description: '',
          streamType: 'YOUTUBE',
          streamUrl: '',
          scheduledStart: '',
          scheduledEnd: '',
        })
        setIsSuccess(false)
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={isSuccess ? () => {} : onClose} title="NUEVA SESIÓN DE RADIO">
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-16 h-16 animate-spin" style={{ color: "#CC933B" }} />
          <p className="text-xl font-bold" style={{ fontFamily: "Rajdhani, sans-serif", color: "#CC933B" }}>
            ✅ Sesión creada exitosamente
          </p>
          <p className="text-sm text-gray-400">Redirigiendo...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Título */}
          <div>
            <label 
              htmlFor="title" 
              className="block text-sm mb-2"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
            >
              Título del Programa *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
              className="w-full px-4 py-2 rounded bg-black/50 text-white"
              style={{ border: '1px solid #CC933B', fontFamily: 'Rajdhani, sans-serif' }}
              placeholder="Ej: Música Electrónica en Vivo"
              disabled={loading}
            />
          </div>

          {/* Descripción */}
          <div>
            <label 
              htmlFor="description" 
              className="block text-sm mb-2"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 rounded bg-black/50 text-white resize-none"
              style={{ border: '1px solid #CC933B', fontFamily: 'Rajdhani, sans-serif' }}
              placeholder="Describe tu programa..."
              disabled={loading}
            />
          </div>

          {/* Tipo de Stream */}
          <div>
            <label 
              htmlFor="streamType" 
              className="block text-sm mb-2"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
            >
              Plataforma *
            </label>
            <select
              id="streamType"
              name="streamType"
              value={formData.streamType}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-black/50 text-white"
              style={{ border: '1px solid #CC933B', fontFamily: 'Rajdhani, sans-serif' }}
            >
              <option value="YOUTUBE">YouTube Live</option>
              <option value="TWITCH">Twitch</option>
              <option value="ICECAST">Icecast (Audio)</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>

          {/* URL del Stream */}
          <div>
            <label 
              htmlFor="streamUrl" 
              className="block text-sm mb-2"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
            >
              URL del Stream *
            </label>
            <input
              type="url"
              id="streamUrl"
              name="streamUrl"
              value={formData.streamUrl}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-black/50 text-white"
              style={{ border: '1px solid #CC933B', fontFamily: 'Rajdhani, sans-serif' }}
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-400 mt-2">
              {formData.streamType === 'YOUTUBE' && 'Ejemplo: https://youtube.com/watch?v=VIDEO_ID'}
              {formData.streamType === 'TWITCH' && 'Ejemplo: https://twitch.tv/tu_canal'}
              {formData.streamType === 'ICECAST' && 'Ejemplo: https://stream.umbraxclan.com/radio (URL para oyentes)'}
              {formData.streamType === 'CUSTOM' && 'URL de tu stream personalizado'}
            </p>
          </div>

          {/* Fecha y hora de inicio */}
          <div>
            <label 
              htmlFor="scheduledStart" 
              className="block text-sm mb-2"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
            >
              Inicio Programado (Opcional)
            </label>
            <input
              type="datetime-local"
              id="scheduledStart"
              name="scheduledStart"
              value={formData.scheduledStart}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-black/50 text-white"
              style={{ border: '1px solid #CC933B', fontFamily: 'Rajdhani, sans-serif' }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Deja vacío para sesión sin horario específico
            </p>
          </div>

          {/* Fecha y hora de fin */}
          <div>
            <label 
              htmlFor="scheduledEnd" 
              className="block text-sm mb-2"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
            >
              Fin Programado (Opcional)
            </label>
            <input
              type="datetime-local"
              id="scheduledEnd"
              name="scheduledEnd"
              value={formData.scheduledEnd}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-black/50 text-white"
              style={{ border: '1px solid #CC933B', fontFamily: 'Rajdhani, sans-serif' }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Deja vacío para sesión sin horario específico
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Rajdhani, sans-serif",
                backgroundColor: "rgba(74, 12, 17, 0.5)",
                border: "2px solid #CC933B",
                color: "#CC933B"
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Rajdhani, sans-serif",
                backgroundColor: "#CC933B",
                color: "#0f0f0f",
                boxShadow: "0 0 20px rgba(204, 147, 59, 0.3)"
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </span>
              ) : (
                'Crear Sesión'
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
