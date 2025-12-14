'use client'

import { useState, useRef } from 'react'
import { Radio, Music, Users, Clock, VolumeX, Music2, Volume2, Loader2 } from 'lucide-react'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayAudio = async () => {
    if (audioRef.current) {
      try {
        setIsLoading(true)
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Error al reproducir audio:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleToggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

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
        // URL personalizada - iniciar reproducción al hacer click
        return (
          <div className="relative flex flex-col items-center justify-center h-full w-full p-4">
            {/* Reproductor de audio (oculto detrás del overlay) */}
            <audio
              ref={audioRef}
              loop
              className="hidden"
              src={session.streamUrl}
            >
              Tu navegador no soporta la reproducción de audio.
            </audio>

            {/* Estado: No iniciado */}
            {!isPlaying && !isLoading && (
              <button
                onClick={handlePlayAudio}
                className="absolute inset-0 flex flex-col items-center justify-center space-y-3 sm:space-y-4 bg-black/70 hover:bg-black/60 transition-colors cursor-pointer z-10 px-4"
                aria-label="Reproducir audio"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[#CC933B] blur-2xl sm:blur-3xl opacity-30 animate-pulse" />
                  <VolumeX className="relative w-16 h-16 sm:w-20 md:w-24 text-[#CC933B]" />
                </div>
                <p className="text-white text-base sm:text-lg md:text-xl font-bold text-center">Click para activar el audio</p>
                <p className="text-gray-400 text-xs sm:text-sm text-center">La transmisión comenzará al instante</p>
              </button>
            )}

            {/* Estado: Cargando */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 sm:space-y-4 bg-black/70 z-10 px-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#CC933B] blur-2xl sm:blur-3xl opacity-30 animate-pulse" />
                  <Loader2 className="relative w-16 h-16 sm:w-20 md:w-24 text-[#CC933B] animate-spin" />
                </div>
                <p className="text-white text-base sm:text-lg md:text-xl font-bold text-center">Cargando transmisión...</p>
                <p className="text-gray-400 text-xs sm:text-sm text-center">Conectando con el servidor</p>
              </div>
            )}

            {/* Estado: Reproduciendo */}
            {isPlaying && !isLoading && (
              <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 w-full px-4">
                {/* Ícono solo visible en sm+ */}
                <div className="relative hidden sm:block">
                  <div className="absolute inset-0 bg-[#CC933B] blur-2xl sm:blur-3xl opacity-30 animate-pulse" />
                  <Music2 className="relative w-16 h-16 sm:w-20 md:w-24 text-[#CC933B] animate-bounce" />
                </div>
                <p className="text-white text-base sm:text-lg font-semibold text-center">🎵 Reproduciendo en vivo 🎵</p>
                <p className="text-gray-400 text-xs sm:text-sm text-center">Disfruta de la transmisión</p>
                {/* Botón de mute/unmute */}
                <button
                  onClick={handleToggleMute}
                  className="mt-2 sm:mt-4 flex items-center space-x-2 bg-[#CC933B]/20 hover:bg-[#CC933B]/30 border border-[#CC933B]/50 rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition-colors"
                  aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-[#CC933B]" />
                      <span className="text-white text-xs sm:text-sm font-medium">Silenciado</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#CC933B]" />
                      <span className="text-white text-xs sm:text-sm font-medium">Audio activo</span>
                    </>
                  )}
                </button>
              </div>
            )}
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
