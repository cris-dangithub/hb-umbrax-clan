'use client'

import { useState, useEffect, useCallback } from 'react'
import HabboAvatar from './HabboAvatar'
import { formatMinutesToReadable } from '@/lib/time-utils'

interface UserProfileCardProps {
  userId: string
  habboName: string
  avatarUrl: string
  rankName: string
  rankOrder: number
  initialTotalMinutes: number
}

export default function UserProfileCard({
  userId,
  habboName,
  avatarUrl,
  rankName,
  rankOrder,
  initialTotalMinutes
}: UserProfileCardProps) {
  const [totalMinutes, setTotalMinutes] = useState(initialTotalMinutes)

  const fetchTotalTime = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/total-time`)
      if (response.ok) {
        const { totalMinutes: newTotal } = await response.json()
        setTotalMinutes(newTotal)
      }
    } catch (error) {
      console.error('Error fetching total time:', error)
    }
  }, [userId])

  useEffect(() => {
    // Conectar SSE para actualizaciones de tiempo total
    const eventSource = new EventSource(`/api/sse/stream?topic=user:${userId}`)
    
    eventSource.addEventListener('session_closed', (e) => {
      console.log('[SSE UserProfile] Sesión cerrada, actualizando tiempo total')
      const data = JSON.parse(e.data)
      
      // Si la sesión cerrada es del usuario actual, refetch el tiempo total
      if (data.subjectUserId === userId) {
        fetchTotalTime()
      }
    })

    eventSource.onerror = () => {
      console.error('[SSE UserProfile] Error en conexión SSE')
    }

    return () => {
      eventSource.close()
    }
  }, [userId, fetchTotalTime])

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
      {/* Avatar */}
      <div
        className="p-2 sm:p-3 rounded-lg flex-shrink-0"
        style={{
          backgroundColor: 'rgba(74, 12, 17, 0.3)',
          border: '2px solid #CC933B',
        }}
      >
        <HabboAvatar
          src={avatarUrl}
          alt={habboName}
          size={80}
          className="sm:w-20 sm:h-32"
        />
      </div>

      {/* Info del usuario */}
      <div className="text-center sm:text-left">
        <h1
          className="text-lg sm:text-xl lg:text-2xl mb-1 sm:mb-2 break-words"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#CC933B',
          }}
        >
          {habboName}
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            color: '#ededed',
          }}
        >
          {rankName}
        </p>
        <p
          className="text-sm"
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            color: '#CC933B',
          }}
        >
          Orden Jerárquico: {rankOrder}/10
        </p>
        {totalMinutes > 0 && (
          <p
            className="text-sm mt-1"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#22c55e',
              fontWeight: 'bold',
            }}
          >
            ⏱️ Tiempo Total: {formatMinutesToReadable(totalMinutes)}
          </p>
        )}
      </div>
    </div>
  )
}
