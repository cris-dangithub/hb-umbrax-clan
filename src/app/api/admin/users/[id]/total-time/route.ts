import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasFullAccess } from '@/lib/get-current-user';
import { getUserTotalTimeMinutes } from '@/lib/time-tracking';

/**
 * GET /api/admin/users/[id]/total-time
 * Obtiene el tiempo total acumulado de un usuario
 * Permisos: El mismo usuario O Cúpula Directiva
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar permisos: mismo usuario O Cúpula
    const isSelf = currentUser.id === id;
    const isCupula = await hasFullAccess();

    if (!isSelf && !isCupula) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver el tiempo de este usuario' },
        { status: 403 }
      );
    }

    const totalMinutes = await getUserTotalTimeMinutes(id);

    return NextResponse.json({
      userId: id,
      totalMinutes,
    });
  } catch (error) {
    console.error('Error obteniendo tiempo total:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
