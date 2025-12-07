'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import HabboAvatar from './HabboAvatar'

interface TimeRequest {
  id: string
  subjectUser: {
    id: string
    habboName: string
    avatarUrl: string
    rank: {
      name: string
      order: number
    }
  }
  createdBy: {
    id: string
    habboName: string
  }
  notes?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  createdAt: string
  expiresAt: string
}

interface TimeRequestsCardProps {
  currentUserId: string
  isSovereign: boolean
  isCupula: boolean
  rankOrder: number
}

export default function TimeRequestsCard({ 
  currentUserId, 
  isSovereign, 
  isCupula,
  rankOrder 
}: TimeRequestsCardProps) {
  const [requests, setRequests] = useState<TimeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  // Súbditos (rangos 4-13 sin isSovereign) pueden ver sus propias solicitudes
  // Soberanos y Cúpula pueden ver solicitudes según su alcance
  const canViewTimeRequests = rankOrder >= 4; // Todos los rangos 4-13 + Cúpula (1-3)

  // Fetch solicitudes pendientes cada 5 segundos
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/admin/time-requests?onlyPending=true')
        if (response.ok) {
          const data = await response.json()
          setRequests(data.timeRequests || [])
        }
      } catch (error) {
        console.error('Error fetching time requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
    const interval = setInterval(fetchRequests, 5000) // Poll cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  const handleRespond = async (requestId: string, action: 'approve' | 'reject') => {
    setResponding(requestId)
    try {
      const response = await fetch(`/api/admin/time-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        // Remover de la lista
        setRequests(prev => prev.filter(r => r.id !== requestId))
      } else {
        const error = await response.json()
        alert(error.error || 'Error al responder solicitud')
      }
    } catch (error) {
      console.error('Error responding to request:', error)
      alert('Error al responder solicitud')
    } finally {
      setResponding(null)
    }
  }

  // Filtrar solicitudes según permisos
  const myRequests = requests.filter(req => {
    // Cúpula: puede ver todas las solicitudes
    if (isCupula) {
      return true;
    }
    
    // Soberano: puede ver solicitudes de su rango
    if (isSovereign) {
      return req.subjectUser.rank.order === rankOrder;
    }
    
    // Súbdito: solo puede ver sus propias solicitudes
    return req.subjectUser.id === currentUserId;
  })

  // No renderizar si el usuario no está en rangos 4-13
  if (!canViewTimeRequests) {
    return null;
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

  if (myRequests.length === 0) {
    return (
      <div className="backdrop-blur-md rounded-lg shadow-2xl p-6" 
        style={{ backgroundColor: 'rgba(15, 15, 15, 0.8)', border: '2px solid #CC933B' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#CC933B' }}>
          <Clock className="inline mr-2" size={24} />
          Solicitudes de Time
        </h2>
        <p style={{ color: 'rgba(204, 147, 59, 0.7)' }}>No hay solicitudes pendientes</p>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-md rounded-lg shadow-2xl p-6" 
      style={{ backgroundColor: 'rgba(15, 15, 15, 0.8)', border: '2px solid #CC933B' }}>
      <h2 className="text-xl font-bold mb-4" style={{ color: '#CC933B' }}>
        <Clock className="inline mr-2" size={24} />
        Solicitudes de Time ({myRequests.length})
      </h2>

      <div className="space-y-4">
        {myRequests.map(request => {
          const expiresAt = new Date(request.expiresAt)
          const now = new Date()
          const secondsLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
          const minutesLeft = Math.floor(secondsLeft / 60)
          const secsLeft = secondsLeft % 60

          return (
            <div key={request.id} 
              className="p-4 rounded-lg" 
              style={{ backgroundColor: 'rgba(74, 12, 17, 0.3)', border: '1px solid #CC933B' }}>
              <div className="flex items-start gap-4">
                <HabboAvatar 
                  src={request.subjectUser.avatarUrl} 
                  alt={request.subjectUser.habboName}
                  size={60}
                />
                <div className="flex-1">
                  <p className="font-bold" style={{ color: '#CC933B' }}>
                    {request.subjectUser.habboName}
                  </p>
                  <p className="text-sm" style={{ color: 'rgba(204, 147, 59, 0.7)' }}>
                    {request.subjectUser.rank.name}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'rgba(204, 147, 59, 0.9)' }}>
                    Solicitado por: {request.createdBy.habboName}
                  </p>
                  {request.notes && (
                    <p className="text-sm mt-1" style={{ color: 'rgba(204, 147, 59, 0.7)' }}>
                      Nota: {request.notes}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: secondsLeft < 60 ? '#ef4444' : '#CC933B' }}>
                    Expira en: {minutesLeft}:{String(secsLeft).padStart(2, '0')}
                  </p>
                </div>

                {request.subjectUser.id === currentUserId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(request.id, 'approve')}
                      disabled={responding === request.id}
                      className="px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                      style={{ 
                        backgroundColor: '#22c55e',
                        color: 'white',
                      }}
                    >
                      {responding === request.id ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <CheckCircle size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => handleRespond(request.id, 'reject')}
                      disabled={responding === request.id}
                      className="px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                      style={{ 
                        backgroundColor: '#ef4444',
                        color: 'white',
                      }}
                    >
                      {responding === request.id ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <XCircle size={20} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
