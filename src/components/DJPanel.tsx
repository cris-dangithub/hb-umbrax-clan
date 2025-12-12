'use client'

import { useState } from 'react'
import { Play, Square, Music, CheckCircle, XCircle, Trash2 } from 'lucide-react'

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

interface DJPanelProps {
  sessionId: string
  sessionStatus: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  songRequests: SongRequest[]
  onStartSession: () => Promise<void>
  onEndSession: () => Promise<void>
  onUpdateRequest: (requestId: string, status: 'ACCEPTED' | 'REJECTED' | 'PLAYED') => Promise<void>
  onDeleteRequest: (requestId: string) => Promise<void>
}

export default function DJPanel({
  sessionId,
  sessionStatus,
  songRequests,
  onStartSession,
  onEndSession,
  onUpdateRequest,
  onDeleteRequest,
}: DJPanelProps) {
  const [loading, setLoading] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  const handleStartSession = async () => {
    setLoading(true)
    try {
      await onStartSession()
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      alert('Error al iniciar la sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!confirm('¿Estás seguro de finalizar la sesión?')) return
    
    setLoading(true)
    try {
      await onEndSession()
    } catch (error) {
      console.error('Error al finalizar sesión:', error)
      alert('Error al finalizar la sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED' | 'PLAYED') => {
    setProcessingRequest(requestId)
    try {
      await onUpdateRequest(requestId, status)
    } catch (error) {
      console.error('Error al actualizar solicitud:', error)
      alert('Error al actualizar la solicitud')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('¿Eliminar esta solicitud?')) return
    
    setProcessingRequest(requestId)
    try {
      await onDeleteRequest(requestId)
    } catch (error) {
      console.error('Error al eliminar solicitud:', error)
      alert('Error al eliminar la solicitud')
    } finally {
      setProcessingRequest(null)
    }
  }

  const pendingRequests = songRequests.filter(r => r.status === 'PENDING')
  const acceptedRequests = songRequests.filter(r => r.status === 'ACCEPTED')
  const playedRequests = songRequests.filter(r => r.status === 'PLAYED')

  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-xl border border-[#CC933B]/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Music className="w-6 h-6 text-[#CC933B]" />
          <span>Panel de DJ</span>
        </h2>

        {/* Controles de sesión */}
        <div className="flex space-x-3">
          {sessionStatus === 'SCHEDULED' && (
            <button
              onClick={handleStartSession}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          )}
          {sessionStatus === 'LIVE' && (
            <button
              onClick={handleEndSession}
              disabled={loading}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Finalizar Sesión</span>
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#4A0C11]/30 rounded-lg p-4 border border-[#CC933B]/20">
          <p className="text-gray-400 text-sm mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">{pendingRequests.length}</p>
        </div>
        <div className="bg-[#4A0C11]/30 rounded-lg p-4 border border-[#CC933B]/20">
          <p className="text-gray-400 text-sm mb-1">Aceptadas</p>
          <p className="text-2xl font-bold text-green-400">{acceptedRequests.length}</p>
        </div>
        <div className="bg-[#4A0C11]/30 rounded-lg p-4 border border-[#CC933B]/20">
          <p className="text-gray-400 text-sm mb-1">Reproducidas</p>
          <p className="text-2xl font-bold text-blue-400">{playedRequests.length}</p>
        </div>
      </div>

      {/* Lista de solicitudes pendientes */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Solicitudes Pendientes</h3>
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay solicitudes pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <div
                key={request.id}
                className="bg-[#4A0C11]/20 border border-[#CC933B]/10 rounded-lg p-4 hover:border-[#CC933B]/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <img
                      src={request.requestedBy.avatarUrl}
                      alt={request.requestedBy.habboName}
                      className="w-10 h-10 rounded-lg border border-[#CC933B]/30"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-semibold">{request.songTitle}</span>
                        {request.artist && (
                          <span className="text-gray-400 text-sm">• {request.artist}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        Solicitada por{' '}
                        <span className="text-[#CC933B]">{request.requestedBy.habboName}</span>
                      </p>
                      {request.message && (
                        <p className="text-sm text-gray-300 mt-2 italic">&quot;{request.message}&quot;</p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleUpdateRequest(request.id, 'ACCEPTED')}
                      disabled={processingRequest === request.id}
                      className="p-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Aceptar"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleUpdateRequest(request.id, 'REJECTED')}
                      disabled={processingRequest === request.id}
                      className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Rechazar"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      disabled={processingRequest === request.id}
                      className="p-2 bg-gray-600/20 hover:bg-gray-600/40 text-gray-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitudes aceptadas (cola de reproducción) */}
      {acceptedRequests.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cola de Reproducción</h3>
          <div className="space-y-2">
            {acceptedRequests.map(request => (
              <div
                key={request.id}
                className="bg-green-900/20 border border-green-500/20 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-medium">{request.songTitle}</span>
                  {request.artist && (
                    <span className="text-gray-400 text-sm ml-2">• {request.artist}</span>
                  )}
                </div>
                <button
                  onClick={() => handleUpdateRequest(request.id, 'PLAYED')}
                  disabled={processingRequest === request.id}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors"
                >
                  <Music className="w-4 h-4" />
                  <span>Marcar como reproducida</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
