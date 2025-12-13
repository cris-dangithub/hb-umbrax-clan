'use client'

import { Radio, Music, Users, Clock } from 'lucide-react'

interface RadioPlayerProps {
  session: {
    id: string
    title: string
    description?: string | null
    streamType: 'YOUTUBE' | 'TWITCH' | 'ICECAST' | 'CUSTOM'
    streamUrl: string
    status: string
    listenerCount: number
    dj: {
      habboName: string
      avatarUrl: string
    }
    scheduledStart: string | null
    scheduledEnd: string | null
    actualStart?: string | null
  }
}

export default function RadioPlayer({ session }: RadioPlayerProps) {
  const isLive = session.status === 'LIVE'

  // Renderizar reproductor según el tipo de stream
  const renderPlayer = () => {
    if (!isLive) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <Radio className="w-16 h-16 text-[#CC933B]/50" />
          <div>
            <p className="text-xl font-bold text-white mb-2">Emisión no iniciada</p>
            <p className="text-gray-400 text-sm">
              La sesión comenzará pronto
            </p>
          </div>
        </div>
      )
    }

    switch (session.streamType) {
      case 'YOUTUBE':
        // Extraer video ID de la URL de YouTube
        const youtubeId = extractYouTubeId(session.streamUrl)
        return (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&modestbranding=1`}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )

      case 'TWITCH':
        // Extraer canal de Twitch
        const twitchChannel = extractTwitchChannel(session.streamUrl)
        return (
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}&autoplay=true`}
            className="w-full h-full rounded-lg"
            allowFullScreen
          />
        )

      case 'ICECAST':
        // Reproductor de audio para Icecast
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#CC933B] blur-3xl opacity-30 animate-pulse" />
              <Music className="relative w-24 h-24 text-[#CC933B]" />
            </div>
            <audio
              controls
              autoPlay
              className="w-full max-w-md"
              src={session.streamUrl}
            >
              Tu navegador no soporta la reproducción de audio.
            </audio>
            <p className="text-gray-400 text-sm">Reproduciendo desde servidor Icecast</p>
          </div>
        )

      case 'CUSTOM':
        // URL personalizada - intentar como audio
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-6 w-full">
            <Music className="w-20 h-20 text-[#CC933B]" />
            <audio
              controls
              autoPlay
              className="w-full max-w-md"
              src={session.streamUrl}
            >
              Tu navegador no soporta la reproducción de audio.
            </audio>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400">Tipo de stream no soportado</p>
          </div>
        )
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-xl border border-[#CC933B]/20 overflow-hidden">
      {/* Header con información de la sesión */}
      <div className="bg-[#4A0C11]/30 border-b border-[#CC933B]/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar del DJ */}
            <img
              src={session.dj.avatarUrl}
              alt={session.dj.habboName}
              className="w-12 h-12 rounded-lg border-2 border-[#CC933B]"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{session.title}</h3>
                {isLive && (
                  <span className="flex items-center space-x-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full" />
                    <span>EN VIVO</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                con <span className="text-[#CC933B] font-semibold">{session.dj.habboName}</span>
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex items-center space-x-4">
            {session.streamType === 'ICECAST' && (
              <div className="flex items-center space-x-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">{session.listenerCount} oyentes</span>
              </div>
            )}
            {session.scheduledStart && (
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {new Date(session.scheduledStart).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Descripción */}
        {session.description && (
          <p className="mt-3 text-sm text-gray-300">{session.description}</p>
        )}
      </div>

      {/* Reproductor */}
      <div className="aspect-video bg-black/50 flex items-center justify-center">
        {renderPlayer()}
      </div>
    </div>
  )
}

// Helpers para extraer IDs de URLs
function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : url
}

function extractTwitchChannel(url: string): string {
  const regExp = /twitch\.tv\/([a-zA-Z0-9_]+)/
  const match = url.match(regExp)
  return match ? match[1] : url
}
