'use client'

import { useState, useEffect } from 'react'
import { Radio, Plus, Music } from 'lucide-react'
import RadioPlayer from '@/components/RadioPlayer'
import RadioSchedule from '@/components/RadioSchedule'
import DJPanel from '@/components/DJPanel'
import SongRequestForm from '@/components/SongRequestForm'
import CreateSessionModal from '@/components/CreateSessionModal'

interface RadioSession {
  id: string
  title: string
  description?: string | null
  streamType: 'YOUTUBE' | 'TWITCH' | 'ICECAST' | 'CUSTOM'
  streamUrl: string
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  scheduledStart: string | null
  scheduledEnd: string | null
  actualStart?: string | null
  actualEnd?: string | null
  listenerCount: number
  dj: {
    id: string
    habboName: string
    avatarUrl: string
    rank: {
      name: string
      icon: string
      order: number
    }
  }
  songRequests?: SongRequest[]
}

interface SongRequest {
  id: string
  songTitle: string
  artist?: string | null
  message?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PLAYED'
  requestedBy: {
    id: string
    habboName: string
    avatarUrl: string
  }
  createdAt: string
}

export default function RadioPage() {
  const [sessions, setSessions] = useState<RadioSession[]>([])
  const [currentSession, setCurrentSession] = useState<RadioSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Cargar usuario actual y sesiones
  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/radio/sessions?limit=10').then(r => r.json())
    ]).then(([userData, sessionsData]) => {
      setCurrentUser(userData?.user || null)
      setSessions(sessionsData?.sessions || [])
      
      // Seleccionar sesión en vivo si existe
      const liveSession = sessionsData?.sessions?.find((s: RadioSession) => s.status === 'LIVE')
      if (liveSession) {
        loadSessionDetails(liveSession.id)
      }
      
      setLoading(false)
    }).catch(error => {
      console.error('Error cargando datos:', error)
      setLoading(false)
    })
  }, [])

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/radio/sessions/${sessionId}`)
      const data = await response.json()
      setCurrentSession(data.session)
    } catch (error) {
      console.error('Error cargando sesión:', error)
    }
  }

  const handleSelectSession = (sessionId: string) => {
    loadSessionDetails(sessionId)
  }

  const handleStartSession = async () => {
    if (!currentSession) return
    
    try {
      const response = await fetch(`/api/radio/sessions/${currentSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIVE' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session)
        // Recargar lista de sesiones
        const sessionsResponse = await fetch('/api/radio/sessions?limit=10')
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData.sessions)
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      throw error
    }
  }

  const handleEndSession = async () => {
    if (!currentSession) return
    
    try {
      const response = await fetch(`/api/radio/sessions/${currentSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session)
        // Recargar lista
        const sessionsResponse = await fetch('/api/radio/sessions?limit=10')
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData.sessions)
      }
    } catch (error) {
      console.error('Error al finalizar sesión:', error)
      throw error
    }
  }

  const handleUpdateRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED' | 'PLAYED') => {
    try {
      const response = await fetch(`/api/radio/song-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok && currentSession) {
        // Recargar detalles de la sesión
        loadSessionDetails(currentSession.id)
      }
    } catch (error) {
      console.error('Error al actualizar solicitud:', error)
      throw error
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/radio/song-requests/${requestId}`, {
        method: 'DELETE',
      })
      
      if (response.ok && currentSession) {
        loadSessionDetails(currentSession.id)
      }
    } catch (error) {
      console.error('Error al eliminar solicitud:', error)
      throw error
    }
  }

  const handleSubmitSongRequest = async (data: {
    songTitle: string
    artist?: string
    message?: string
  }) => {
    if (!currentSession) return
    
    try {
      const response = await fetch('/api/radio/song-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          ...data,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar solicitud')
      }
      
      // Recargar detalles
      loadSessionDetails(currentSession.id)
      setShowRequestForm(false)
    } catch (error) {
      console.error('Error al enviar solicitud:', error)
      throw error
    }
  }

  const handleCreateSession = async (data: {
    title: string
    description?: string
    streamType: 'YOUTUBE' | 'TWITCH' | 'ICECAST' | 'CUSTOM'
    streamUrl: string
    scheduledStart?: string
    scheduledEnd?: string
  }) => {
    try {
      const response = await fetch('/api/radio/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear sesión')
      }
      
      const result = await response.json()
      
      // Recargar lista de sesiones
      const sessionsResponse = await fetch('/api/radio/sessions?limit=10')
      const sessionsData = await sessionsResponse.json()
      setSessions(sessionsData.sessions)
      
      // Seleccionar la sesión recién creada
      loadSessionDetails(result.session.id)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error al crear sesión:', error)
      throw error
    }
  }

  const isDJ = currentUser?.isDJ || false
  const isCupula = currentUser?.rank?.order <= 3

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Cargando radio...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Radio className="w-8 h-8 text-[#CC933B]" />
            <h1 className="text-3xl font-bold text-white">NOVAX RADIO</h1>
          </div>
          
          {/* Botón Crear Sesión (solo DJ o Cúpula) */}
          {(isDJ || isCupula) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#CC933B] hover:bg-[#b8842f] text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Sesión</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reproductor */}
            {currentSession ? (
              <RadioPlayer session={currentSession} />
            ) : (
              <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-xl border border-[#CC933B]/20 p-12 text-center">
                <Music className="w-16 h-16 text-[#CC933B]/50 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No hay emisión activa</h2>
                <p className="text-gray-400">Selecciona un programa de la programación</p>
              </div>
            )}

            {/* Panel de DJ (solo si es DJ o Cúpula y hay sesión seleccionada) */}
            {(isDJ || isCupula) && currentSession && (
              <DJPanel
                sessionId={currentSession.id}
                sessionStatus={currentSession.status}
                songRequests={currentSession.songRequests || []}
                onStartSession={handleStartSession}
                onEndSession={handleEndSession}
                onUpdateRequest={handleUpdateRequest}
                onDeleteRequest={handleDeleteRequest}
              />
            )}

            {/* Formulario de solicitud de canción (solo si hay sesión en vivo y el usuario está autenticado) */}
            {currentUser && currentSession?.status === 'LIVE' && !showRequestForm && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="w-full bg-[#CC933B] hover:bg-[#b8842f] text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Solicitar una Canción</span>
              </button>
            )}

            {showRequestForm && currentSession && (
              <SongRequestForm
                sessionId={currentSession.id}
                onSubmit={handleSubmitSongRequest}
                onClose={() => setShowRequestForm(false)}
              />
            )}
          </div>

          {/* Sidebar - Programación */}
          <div>
            <RadioSchedule
              sessions={sessions}
              onSelectSession={handleSelectSession}
            />
          </div>
        </div>

        {/* Modal de crear sesión */}
        {showCreateModal && (
          <CreateSessionModal
            isOpen={showCreateModal}
            onSubmit={handleCreateSession}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  )
}

