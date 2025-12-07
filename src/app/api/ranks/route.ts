import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminAccess } from '@/lib/get-current-user';

/**
 * GET /api/ranks
 * Obtiene la lista de rangos disponibles
 * Accesible por Cúpula Directiva (rangos 1-3) y Soberanos
 */
export async function GET() {
  try {
    // Verificar permisos administrativos (Cúpula o Soberano)
    const adminAccess = await hasAdminAccess();
    if (!adminAccess) {
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
