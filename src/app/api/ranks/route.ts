import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasFullAccess } from '@/lib/get-current-user';

/**
 * GET /api/ranks
 * Obtiene la lista de rangos disponibles
 */
export async function GET() {
  try {
    const fullAccess = await hasFullAccess();
    if (!fullAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      );
    }

    const ranks = await prisma.rank.findMany({
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ success: true, ranks });
  } catch (error) {
    console.error('Error al obtener rangos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
