'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import HabboAvatar from './HabboAvatar'
import { useToast } from './ToastProvider'

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
  const [, setTick] = useState(0)
  const { showToast } = useToast()

  // Súbditos (rangos 4-13 sin isSovereign) pueden ver sus propias solicitudes
  // Soberanos y Cúpula pueden ver solicitudes según su alcance
  const canViewTimeRequests = rankOrder >= 4; // Todos los rangos 4-13 + Cúpula (1-3)

  // Fetch inicial de solicitudes pendientes
  const fetchRequests = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    // Fetch inicial
    fetchRequests()

    // Timer local para actualizar countdown cada segundo (solo UI, sin refetch)
    const timerInterval = setInterval(() => {
      setTick(prev => prev + 1)
    }, 1000)

    // Conectar SSE para actualizaciones en tiempo real
    const eventSource = new EventSource(`/api/sse/stream?topic=user:${currentUserId}`)
    
    eventSource.addEventListener('connected', () => {
      console.log('[SSE TimeRequests] ✓ Conectado al stream de eventos')
    })

    eventSource.addEventListener('time_request', (e) => {
      console.log('[SSE TimeRequests] Nueva solicitud recibida:', e.data)
      const data = JSON.parse(e.data)
      
      // Mostrar notificación toast
      showToast(
        `Nueva solicitud de time de ${data.supervisorName}`,
        'info',
        7000
      )
      
      // Agregar nueva solicitud a la lista
      const newRequest: TimeRequest = {
        id: data.requestId,
        subjectUser: {
          id: currentUserId,
          habboName: '', // Se llenará en refetch
          avatarUrl: '',
          rank: {
            name: '',
            order: rankOrder
          }
        },
        createdBy: {
          id: data.supervisorId,
          habboName: data.supervisorName
        },
        notes: data.notes,
        status: 'PENDING',
        createdAt: data.timestamp,
        expiresAt: data.expiresAt
      }
      
      // Refetch para obtener datos completos
      fetchRequests()
    })

    eventSource.addEventListener('time_request_result', (e) => {
      console.log('[SSE TimeRequests] Resultado de solicitud:', e.data)
      const data = JSON.parse(e.data)
      
      // Actualizar estado de la solicitud para feedback visual
      setRequests(prev => prev.map(req => 
        req.id === data.requestId 
          ? { ...req, status: data.status === 'approved' ? 'APPROVED' : 'REJECTED' }
          : req
      ))
      
      // Mostrar notificación toast
      if (data.status === 'approved') {
        showToast(
          `✓ ${data.subjectName} aceptó tu solicitud de time`,
          'success',
          7000
        )
      } else {
        showToast(
          `✗ ${data.subjectName} rechazó tu solicitud de time`,
          'error',
          7000
        )
      }
      
      // Eliminar después de 2 segundos
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== data.requestId))
      }, 2000)
    })

    eventSource.addEventListener('invalidate', () => {
      console.log('[SSE TimeRequests] Invalidación forzada, refetching...')
      fetchRequests()
    })

    eventSource.onerror = (error) => {
      console.error('[SSE TimeRequests] ✗ Error en conexión')
      console.error('[SSE TimeRequests] readyState:', eventSource.readyState)
    }
    
    eventSource.onopen = () => {
      console.log('[SSE TimeRequests] ✓ Conexión abierta')
    }

    return () => {
      clearInterval(timerInterval)
      eventSource.close()
    }
  }, [currentUserId, rankOrder, fetchRequests])

  const handleRespond = async (requestId: string, action: 'approve' | 'reject') => {
    setResponding(requestId)
    try {
      const response = await fetch(`/api/admin/time-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Actualizar el estado de la solicitud localmente para feedback visual inmediato
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : req
        ))
        
        // Eliminar después de 2 segundos para dar feedback visual
        setTimeout(() => {
          setRequests(prev => prev.filter(r => r.id !== requestId))
        }, 2000)
        
        console.log(`[TimeRequests] Solicitud ${action === 'approve' ? 'aceptada' : 'rechazada'}`)
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

  // Filtrar solicitudes según permisos y eliminar expiradas
  const myRequests = requests.filter(req => {
    // Eliminar solicitudes expiradas
    const expiresAt = new Date(req.expiresAt)
    const now = new Date()
    if (expiresAt <= now) {
      return false
    }

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
          
          const isApproved = request.status === 'APPROVED'
          const isRejected = request.status === 'REJECTED'
          const isResponded = isApproved || isRejected

          return (
            <div key={request.id} 
              className="p-4 rounded-lg transition-all" 
              style={{ 
                backgroundColor: isApproved 
                  ? 'rgba(34, 197, 94, 0.2)' 
                  : isRejected 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'rgba(74, 12, 17, 0.3)', 
                border: `1px solid ${isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#CC933B'}` 
              }}>
              <div className="flex items-start gap-4">
                <HabboAvatar 
                  src={request.subjectUser.avatarUrl} 
                  alt={request.subjectUser.habboName}
                  size={60}
                />
                <div className="flex-1">
                  <p className="font-bold" style={{ color: isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#CC933B' }}>
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
                  {isResponded ? (
                    <p className="text-sm mt-2 font-bold" style={{ color: isApproved ? '#22c55e' : '#ef4444' }}>
                      {isApproved ? '✓ Aceptada' : '✗ Rechazada'}
                    </p>
                  ) : (
                    <p className="text-xs mt-2" style={{ color: secondsLeft < 60 ? '#ef4444' : '#CC933B' }}>
                      Expira en: {minutesLeft}:{String(secsLeft).padStart(2, '0')}
                    </p>
                  )}
                </div>

                {request.subjectUser.id === currentUserId && !isResponded && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(request.id, 'approve')}
                      disabled={responding === request.id}
                      className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 hover:scale-105"
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
                      className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 hover:scale-105"
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
