'use client';

import { useState, useEffect, useCallback } from 'react';
import HabboAvatar from './HabboAvatar';
import ProgressBar from './ProgressBar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatMinutesToReadable } from '@/lib/time-utils';
import type { SessionCreatedEventData, SessionClosedEventData } from '@/lib/websocket-protocol';

interface ActiveSession {
  id: string;
  startedAt: string | Date;
  elapsedMinutes: number;
  currentSupervisor: {
    id: string;
    habboName: string;
    avatarUrl: string;
    rank: {
      name: string;
    };
  } | null;
  subjectUser: {
    id: string;
    habboName: string;
    avatarUrl: string;
    rank: {
      name: string;
      order: number;
      missionPromotionGoal: string | null;
    };
  };
}

interface MyActiveTimeCardProps {
  userId: string;
  userName: string;
  avatarUrl: string;
  rankName: string;
  rankOrder: number;
  missionPromotionGoal: string | null;
  initialTotalMinutes: number;
  initialActiveSession?: ActiveSession | null;
  showBorder?: boolean;
  className?: string;
}

export default function MyActiveTimeCard({
  userId,
  missionPromotionGoal,
  initialTotalMinutes,
  initialActiveSession = null,
  showBorder = true,
  className = '',
}: MyActiveTimeCardProps) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(initialActiveSession);
  const [totalMinutes, setTotalMinutes] = useState(initialTotalMinutes);
  const [elapsedMinutes, setElapsedMinutes] = useState(initialActiveSession?.elapsedMinutes || 0);
  const [loading, setLoading] = useState(!initialActiveSession && initialActiveSession !== null);

  // Fetch initial active session (only if not provided)
  const fetchActiveSession = useCallback(async () => {
    if (initialActiveSession !== undefined) {
      // Session was provided from server, no need to fetch
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/time-sessions/my-active');
      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
        if (data.session) {
          setElapsedMinutes(data.session.elapsedMinutes);
        } else {
          setElapsedMinutes(0);
        }
      }
    } catch (error) {
      console.error('Error fetching active session:', error);
    } finally {
      setLoading(false);
    }
  }, [initialActiveSession]);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Update elapsed time every second
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      setElapsedMinutes((prev) => prev + 1 / 60);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Handle WebSocket events
  useWebSocket({
    topics: [`user:${userId}`],
    events: {
      session_created: (data) => {
        const eventData = data as SessionCreatedEventData;
        if (eventData.subjectUserId === userId) {
          setActiveSession({
            id: eventData.sessionId,
            startedAt: eventData.startedAt,
            elapsedMinutes: 0,
            currentSupervisor: {
              id: eventData.supervisorId,
              habboName: eventData.supervisorName,
              avatarUrl: '', // Not provided in event
              rank: {
                name: eventData.supervisorRank,
              },
            },
            subjectUser: {
              id: eventData.subjectUserId,
              habboName: eventData.subjectName,
              avatarUrl: eventData.subjectAvatarUrl,
              rank: {
                name: eventData.subjectRank,
                order: eventData.subjectRankOrder,
                missionPromotionGoal: eventData.subjectRankMissionGoal || null,
              },
            },
          });
          setElapsedMinutes(0);
        }
      },
      session_closed: (data) => {
        const eventData = data as SessionClosedEventData;
        if (eventData.subjectUserId === userId) {
          setActiveSession(null);
          setElapsedMinutes(0);
          setTotalMinutes((prev) => prev + eventData.totalMinutes);
        }
      },
      session_updated: (data) => {
        const eventData = data as { 
          subjectUserId: string;
          action: string;
          newSupervisorId?: string;
          newSupervisorName?: string;
        };
        if (eventData.subjectUserId === userId && eventData.action === 'supervisor_transferred') {
          setActiveSession((prev) => {
            if (!prev || !eventData.newSupervisorId || !eventData.newSupervisorName) return prev;
            return {
              ...prev,
              currentSupervisor: {
                id: eventData.newSupervisorId,
                habboName: eventData.newSupervisorName,
                avatarUrl: '',
                rank: {
                  name: '',
                },
              },
            };
          });
        }
      },
    },
  });

  // Parse goal format "dd HH:mm" to total minutes
  const parseGoalToMinutes = (goal: string | null): number | null => {
    if (!goal) return null;
    
    const match = goal.match(/^(\d+)\s+(\d+):(\d+)$/);
    if (!match) return null;

    const days = parseInt(match[1], 10);
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);

    return days * 24 * 60 + hours * 60 + minutes;
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    const goalMinutes = parseGoalToMinutes(missionPromotionGoal);
    if (!goalMinutes) return 100; // No goal = full bar

    const currentTotal = totalMinutes + elapsedMinutes;
    const progress = (currentTotal / goalMinutes) * 100;

    return Math.min(progress, 100); // Cap at 100%
  };

  const progressPercentage = calculateProgress();
  const goalMinutes = parseGoalToMinutes(missionPromotionGoal);
  const currentTotal = totalMinutes + elapsedMinutes;

  if (loading) {
    return null; // Don't show anything while loading
  }

  // Only render if user has an active session
  if (!activeSession) {
    return null;
  }

  return (
    <div 
      className={`backdrop-blur-md rounded-lg shadow-2xl ${showBorder ? 'p-4 sm:p-6' : ''} ${className}`}
      style={{
        backgroundColor: 'rgba(15, 15, 15, 0.8)',
        ...(showBorder && { border: '2px solid #CC933B' }),
      }}
    >
      {/* Title */}
      <h2 
        className="text-base sm:text-xl mb-3 sm:mb-4"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#CC933B',
          fontSize: 'clamp(12px, 2.5vw, 14px)',
        }}
      >
        MI TIME ACTIVO
      </h2>

      {/* Progress Section */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span 
            className="text-sm sm:text-base"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: 'rgba(204, 147, 59, 0.9)',
            }}
          >
            Progreso hacia promoción
          </span>
          <span 
            className="text-sm sm:text-base font-semibold"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#CC933B',
            }}
          >
            {goalMinutes 
              ? `${formatMinutesToReadable(Math.floor(currentTotal))} / ${formatMinutesToReadable(goalMinutes)}`
              : 'Sin meta establecida'
            }
          </span>
        </div>
        <ProgressBar value={progressPercentage} />
      </div>

      {/* Active Session Info */}
      <div 
        className="rounded-lg p-4"
        style={{
          backgroundColor: 'rgba(74, 12, 17, 0.3)',
          border: '1px solid rgba(204, 147, 59, 0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span 
            className="text-sm sm:text-base font-semibold"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#22c55e',
            }}
          >
            🟢 Sesión Activa
          </span>
          <span 
            className="text-sm sm:text-base font-mono font-bold"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#CC933B',
            }}
          >
            {formatMinutesToReadable(Math.floor(elapsedMinutes))}
          </span>
        </div>

        {activeSession.currentSupervisor && (
          <div 
            className="flex items-center gap-3 pt-3"
            style={{
              borderTop: '1px solid rgba(204, 147, 59, 0.2)',
            }}
          >
            <HabboAvatar 
              src={`https://www.habbo.es/habbo-imaging/avatarimage?user=${activeSession.currentSupervisor.habboName}&size=m`}
              alt={activeSession.currentSupervisor.habboName}
              size={40} 
            />
            <div>
              <p 
                className="text-xs"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: 'rgba(204, 147, 59, 0.7)',
                }}
              >
                Supervisado por
              </p>
              <p 
                className="text-sm sm:text-base font-semibold"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                }}
              >
                {activeSession.currentSupervisor.habboName}
              </p>
              <p 
                className="text-xs"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: 'rgba(204, 147, 59, 0.5)',
                }}
              >
                {activeSession.currentSupervisor.rank.name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
