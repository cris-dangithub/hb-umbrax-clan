import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Find active session for the current user
    const activeSession = await prisma.timeSession.findFirst({
      where: {
        subjectUserId: currentUser.id,
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
      return NextResponse.json({ session: null });
    }

    // Calculate elapsed minutes
    const now = new Date();
    const startedAt = new Date(activeSession.startedAt);
    const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / 60000);

    const currentSupervisor = activeSession.segments[0]?.currentSupervisor || null;

    return NextResponse.json({
      session: {
        id: activeSession.id,
        startedAt: activeSession.startedAt,
        elapsedMinutes,
        currentSupervisor,
        subjectUser: activeSession.subjectUser,
      },
    });
  } catch (error) {
    console.error('Error fetching my active session:', error);
    return NextResponse.json(
      { error: 'Error al obtener la sesión activa' },
      { status: 500 }
    );
  }
}
