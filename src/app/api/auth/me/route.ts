import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';

/**
 * GET /api/auth/me
 * Obtiene información del usuario actual
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        habboName: user.habboName,
        avatarUrl: user.avatarUrl,
        rankId: user.rankId,
        isSovereign: user.isSovereign,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        rank: {
          id: user.rank.id,
          name: user.rank.name,
          order: user.rank.order,
          icon: user.rank.icon,
          roleDescription: user.rank.roleDescription,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
