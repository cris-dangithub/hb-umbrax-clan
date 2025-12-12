'use client'

import { useState } from 'react'
import { Music, Send, X } from 'lucide-react'

interface SongRequestFormProps {
  sessionId: string
  onSubmit: (data: {
    songTitle: string
    artist?: string
    message?: string
  }) => Promise<void>
  onClose?: () => void
}

export default function SongRequestForm({ sessionId, onSubmit, onClose }: SongRequestFormProps) {
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!songTitle.trim()) {
      setError('El título de la canción es requerido')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        songTitle: songTitle.trim(),
        artist: artist.trim() || undefined,
        message: message.trim() || undefined,
      })

      // Limpiar formulario
      setSongTitle('')
      setArtist('')
      setMessage('')
      
      // Cerrar modal si existe
      onClose?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-xl border border-[#CC933B]/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <Music className="w-6 h-6 text-[#CC933B]" />
          <span>Solicitar Canción</span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título de la canción */}
        <div>
          <label htmlFor="songTitle" className="block text-sm font-medium text-gray-300 mb-2">
            Título de la canción <span className="text-red-400">*</span>
          </label>
          <input
            id="songTitle"
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Ej: Bohemian Rhapsody"
            maxLength={200}
            className="w-full bg-[#4A0C11]/30 border border-[#CC933B]/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#CC933B] transition-colors"
            required
          />
        </div>

        {/* Artista */}
        <div>
          <label htmlFor="artist" className="block text-sm font-medium text-gray-300 mb-2">
            Artista (opcional)
          </label>
          <input
            id="artist"
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Ej: Queen"
            maxLength={200}
            className="w-full bg-[#4A0C11]/30 border border-[#CC933B]/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#CC933B] transition-colors"
          />
        </div>

        {/* Mensaje */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
            Mensaje para el DJ (opcional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Añade un mensaje o dedicatoria..."
            maxLength={500}
            rows={3}
            className="w-full bg-[#4A0C11]/30 border border-[#CC933B]/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#CC933B] transition-colors resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length}/500 caracteres
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={loading || !songTitle.trim()}
          className="w-full bg-[#CC933B] hover:bg-[#b8842f] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Send className="w-5 h-5" />
          <span>{loading ? 'Enviando...' : 'Enviar Solicitud'}</span>
        </button>

        <p className="text-xs text-gray-400 text-center">
          Tu solicitud será revisada por el DJ antes de ser reproducida
        </p>
      </form>
    </div>
  )
}
