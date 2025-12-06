import { NextResponse } from 'next/server';
import { cleanExpiredRequests } from '@/lib/time-tracking';

/**
 * GET /api/admin/time-requests/cleanup
 * Limpia solicitudes expiradas (marca como EXPIRED)
 * Este endpoint debe ser llamado periódicamente (ej: cada 5 minutos)
 */
export async function GET() {
  try {
    const count = await cleanExpiredRequests();

    return NextResponse.json({
      success: true,
      expiredCount: count,
      message: `Se marcaron ${count} solicitudes como expiradas`,
    });
  } catch (error) {
    console.error('Error limpiando solicitudes expiradas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
