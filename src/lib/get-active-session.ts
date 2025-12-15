import { prisma } from '@/lib/prisma';

export interface ActiveSessionData {
  id: string;
  startedAt: Date;
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

export async function getActiveSession(userId: string): Promise<ActiveSessionData | null> {
  try {
    const activeSession = await prisma.timeSession.findFirst({
      where: {
        subjectUserId: userId,
        status: 'ACTIVE',
      },
      include: {
        subjectUser: {
          select: {
            id: true,
            habboName: true,
            avatarUrl: true,
            rank: {
              select: {
                name: true,
                order: true,
                missionPromotionGoal: true,
              },
            },
          },
        },
        segments: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 1,
          include: {
            currentSupervisor: {
              select: {
                id: true,
                habboName: true,
                avatarUrl: true,
                rank: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!activeSession) {
      return null;
    }

    // Calculate elapsed minutes
    const now = new Date();
    const startedAt = new Date(activeSession.startedAt);
    const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / 60000);

    const currentSupervisor = activeSession.segments[0]?.currentSupervisor || null;

    return {
      id: activeSession.id,
      startedAt: activeSession.startedAt,
      elapsedMinutes,
      currentSupervisor,
      subjectUser: activeSession.subjectUser,
    };
  } catch (error) {
    console.error('Error fetching active session:', error);
    return null;
  }
}
