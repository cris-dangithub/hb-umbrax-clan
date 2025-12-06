'use client'

import { useState, useEffect } from 'react'
import { Timer, Loader2, X, ArrowRightLeft } from 'lucide-react'
import HabboAvatar from './HabboAvatar'
import { formatMinutesToReadable } from '@/lib/time-tracking'
import TransferTimeModal from './TransferTimeModal'
import ConfirmationModal from './ConfirmationModal'
import { generateConfirmationCode } from '@/lib/confirmation'

interface ActiveSession {
  id: string
  subjectUser: {
    id: string
    habboName: string
    avatarUrl: string
    rank: {
      name: string
      order: number
      missionPromotionGoal?: string
    }
  }
  startedAt: string
  elapsedMinutes: number
  currentSupervisor: {
    id: string
    habboName: string
    rank: {
      name: string
    }
  } | null
}

interface ActiveTimesTableProps {
  currentUserId: string
  isCupula: boolean
  isSovereign: boolean
}

export default function ActiveTimesTable({ 
  currentUserId, 
  isCupula
}: ActiveTimesTableProps) {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState<string | null>(null)
  const [transferSession, setTransferSession] = useState<ActiveSession | null>(null)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [confirmationCodes, setConfirmationCodes] = useState<string[]>([])
  const [closingSession, setClosingSession] = useState<ActiveSession | null>(null)

  // Fetch sesiones activas cada 1 segundo para actualizar timers
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/admin/time-sessions/active')
        if (response.ok) {
          const data = await response.json()
          setSessions(data.sessions || [])
        }
      } catch (error) {
        console.error('Error fetching active sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
    const interval = setInterval(fetchSessions, 1000) // Poll cada 1 segundo

    return () => clearInterval(interval)
  }, [])

  const handlePreviewClose = (session: ActiveSession) => {
    setClosingSession(session)
    const code = generateConfirmationCode()
    setConfirmationCodes([code])
    setShowCloseConfirmation(true)
  }

  const handleConfirmClose = async () => {
    if (!closingSession) return
    setClosing(closingSession.id)
    try {
      const response = await fetch(`/api/admin/time-sessions/${closingSession.id}/close`, {
        method: 'POST',
      })

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== closingSession.id))
        setShowCloseConfirmation(false)
        setClosingSession(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al cerrar sesión')
      }
    } catch (error) {
      console.error('Error closing session:', error)
      alert('Error al cerrar sesión')
    } finally {
      setClosing(null)
    }
  }

  const handleTransferComplete = () => {
    setTransferSession(null)
  }

  const canCloseSession = (session: ActiveSession) => {
    // Cúpula puede cerrar todo
    if (isCupula) return true
    // Supervisor actual puede cerrar
    return session.currentSupervisor?.id === currentUserId
  }

  const canTransferSession = (session: ActiveSession) => {
    // Igual que close
    return canCloseSession(session)
  }

  if (loading) {
    return (
      <div className="backdrop-blur-md rounded-lg shadow-2xl p-6" 
        style={{ backgroundColor: 'rgba(15, 15, 15, 0.8)', border: '2px solid #CC933B' }}>
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin" size={24} style={{ color: '#CC933B' }} />
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="backdrop-blur-md rounded-lg shadow-2xl p-6" 
        style={{ backgroundColor: 'rgba(15, 15, 15, 0.8)', border: '2px solid #CC933B' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#CC933B' }}>
          <Timer className="inline mr-2" size={24} />
          Times Activos
        </h2>
        <p style={{ color: 'rgba(204, 147, 59, 0.7)' }}>No hay times activos</p>
      </div>
    )
  }

  return (
    <>
      <div className="backdrop-blur-md rounded-lg shadow-2xl p-6" 
        style={{ backgroundColor: 'rgba(15, 15, 15, 0.8)', border: '2px solid #CC933B' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#CC933B' }}>
          <Timer className="inline mr-2" size={24} />
          Times Activos ({sessions.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '2px solid #CC933B' }}>
                <th className="text-left p-3" style={{ color: '#CC933B' }}>Súbdito</th>
                <th className="text-left p-3" style={{ color: '#CC933B' }}>Rango</th>
                <th className="text-left p-3" style={{ color: '#CC933B' }}>Supervisor</th>
                <th className="text-left p-3" style={{ color: '#CC933B' }}>Tiempo</th>
                <th className="text-left p-3" style={{ color: '#CC933B' }}>Progreso</th>
                <th className="text-right p-3" style={{ color: '#CC933B' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => {
                // Calcular tiempo actual (actualizándose cada segundo)
                const startedAt = new Date(session.startedAt)
                const now = new Date()
                const currentMinutes = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60))
                
                // Calcular progreso si hay meta
                const goalString = session.subjectUser.rank.missionPromotionGoal
                let progress = null
                if (goalString) {
                  const match = goalString.match(/^(\d{2})\s(\d{2}):(\d{2})$/)
                  if (match) {
                    const [, days, hours, minutes] = match
                    const goalMinutes = parseInt(days) * 24 * 60 + parseInt(hours) * 60 + parseInt(minutes)
                    progress = Math.min(100, Math.round((currentMinutes / goalMinutes) * 100))
                  }
                }

                return (
                  <tr key={session.id} style={{ borderBottom: '1px solid rgba(204, 147, 59, 0.2)' }}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <HabboAvatar 
                          src={session.subjectUser.avatarUrl}
                          alt={session.subjectUser.habboName}
                          size={50}
                        />
                        <span style={{ color: '#CC933B' }}>
                          {session.subjectUser.habboName}
                        </span>
                      </div>
                    </td>
                    <td className="p-3" style={{ color: 'rgba(204, 147, 59, 0.7)' }}>
                      {session.subjectUser.rank.name}
                    </td>
                    <td className="p-3" style={{ color: 'rgba(204, 147, 59, 0.7)' }}>
                      {session.currentSupervisor?.habboName || 'N/A'}
                    </td>
                    <td className="p-3 font-mono font-bold" style={{ color: '#CC933B' }}>
                      {formatMinutesToReadable(currentMinutes)}
                    </td>
                    <td className="p-3">
                      {progress !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-4 rounded-full" style={{ backgroundColor: 'rgba(74, 12, 17, 0.5)' }}>
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: progress >= 100 ? '#22c55e' : '#CC933B'
                              }}
                            />
                          </div>
                          <span className="text-sm" style={{ color: '#CC933B' }}>
                            {progress}%
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'rgba(204, 147, 59, 0.5)' }}>Sin meta</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {canTransferSession(session) && (
                          <button
                            onClick={() => setTransferSession(session)}
                            className="px-3 py-1 rounded-lg transition-all"
                            style={{ 
                              backgroundColor: 'rgba(204, 147, 59, 0.2)',
                              border: '1px solid #CC933B',
                              color: '#CC933B'
                            }}
                            title="Transferir supervisor"
                          >
                            <ArrowRightLeft size={18} />
                          </button>
                        )}
                        {canCloseSession(session) && (
                          <button
                            onClick={() => handlePreviewClose(session)}
                            disabled={closing === session.id}
                            className="px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                            style={{ 
                              backgroundColor: '#ef4444',
                              color: 'white',
                            }}
                            title="Cerrar sesión"
                          >
                            {closing === session.id ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <X size={18} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {transferSession && (
        <TransferTimeModal
          session={transferSession}
          onClose={() => setTransferSession(null)}
          onSuccess={handleTransferComplete}
        />
      )}

      <ConfirmationModal
        isOpen={showCloseConfirmation}
        onClose={() => {
          setShowCloseConfirmation(false)
          setClosingSession(null)
        }}
        onConfirm={handleConfirmClose}
        title="Confirmar Cierre de Sesión"
        previewMessage={
          closingSession 
            ? `Sesión de time cerrada para ${closingSession.subjectUser.habboName}. Total registrado: ${formatMinutesToReadable(closingSession.elapsedMinutes)}.`
            : ''
        }
        confirmationCodes={confirmationCodes}
        isLoading={closing === closingSession?.id}
      />
    </>
  )
}
