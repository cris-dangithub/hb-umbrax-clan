'use client'

import { Calendar, Clock, Radio } from 'lucide-react'

interface RadioSession {
  id: string
  title: string
  description?: string | null
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  scheduledStart: string | null
  scheduledEnd: string | null
  dj: {
    habboName: string
    avatarUrl: string
    rank: {
      name: string
      icon: string
    }
  }
}

interface RadioScheduleProps {
  sessions: RadioSession[]
  onSelectSession?: (sessionId: string) => void
}

export default function RadioSchedule({ sessions, onSelectSession }: RadioScheduleProps) {
  const upcomingSessions = sessions.filter(s => s.status === 'SCHEDULED')
  const liveSessions = sessions.filter(s => s.status === 'LIVE')

  const getStatusBadge = (status: string, hasSchedule: boolean = true) => {
    // Badge especial para sesiones permanentes
    if (!hasSchedule) {
      return (
        <span className="bg-purple-500/20 text-purple-400 text-xs font-semibold px-2 py-1 rounded-full">
          PERMANENTE
        </span>
      )
    }

    switch (status) {
      case 'LIVE':
        return (
          <span className="flex items-center space-x-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full" />
            <span>EN VIVO</span>
          </span>
        )
      case 'SCHEDULED':
        return (
          <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2 py-1 rounded-full">
            PROGRAMADA
          </span>
        )
      case 'ENDED':
        return (
          <span className="bg-gray-600/20 text-gray-400 text-xs font-semibold px-2 py-1 rounded-full">
            FINALIZADA
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-2 py-1 rounded-full">
            CANCELADA
          </span>
        )
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) {
      return {
        date: 'Sin programación',
        time: '',
      }
    }
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const SessionCard = ({ session }: { session: RadioSession }) => {
    const hasSchedule = session.scheduledStart !== null && session.scheduledEnd !== null
    const start = formatDateTime(session.scheduledStart)
    const end = formatDateTime(session.scheduledEnd)

    return (
      <div
        className="bg-[#4A0C11]/20 border border-[#CC933B]/20 rounded-lg p-4 hover:border-[#CC933B]/40 transition-all cursor-pointer"
        onClick={() => onSelectSession?.(session.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-bold text-white">{session.title}</h3>
              {getStatusBadge(session.status, hasSchedule)}
            </div>
            {session.description && (
              <p className="text-sm text-gray-400 line-clamp-2">{session.description}</p>
            )}
          </div>
        </div>

        {/* DJ Info */}
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={session.dj.avatarUrl}
            alt={session.dj.habboName}
            className="w-10 h-10 rounded-lg border border-[#CC933B]/30"
          />
          <div>
            <p className="text-sm text-gray-400">DJ</p>
            <p className="text-white font-semibold">{session.dj.habboName}</p>
          </div>
        </div>

        {/* Horario - Solo si hay programación */}
        {hasSchedule ? (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="capitalize">{start.date}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>
                {start.time} - {end.time}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-purple-400">
            <Clock className="w-4 h-4" />
            <span>Sesión sin horario específico</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-xl border border-[#CC933B]/20 p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
        <Calendar className="w-6 h-6 text-[#CC933B]" />
        <span>Programación</span>
      </h2>

      {/* Sesiones en vivo */}
      {liveSessions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
            <Radio className="w-5 h-5 text-red-500" />
            <span>Ahora en Vivo</span>
          </h3>
          <div className="space-y-3">
            {liveSessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {/* Próximas sesiones */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Próximos Programas</h3>
        {upcomingSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay programas programados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
