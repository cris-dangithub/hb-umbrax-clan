import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasFullAccess } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { hash } from 'bcryptjs';
import { buildPasswordChangeDetails } from '@/lib/audit-details';

/**
 * PATCH /api/admin/users/[id]/password
 * Cambia la contraseña de un usuario
 * Solo accesible por Cúpula Directiva (rangos 1-3)
 * No se puede cambiar la contraseña de miembros de la Cúpula
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar que el usuario actual tiene acceso total (Cúpula)
    const fullAccess = await hasFullAccess();
    if (!fullAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validar datos
    const { newPassword, reason } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'La razón debe tener al menos 10 caracteres' },
        { status: 400 }
      );
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { rank: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No se puede cambiar la contraseña de miembros de la Cúpula
    if (targetUser.rank.order <= 3) {
      return NextResponse.json(
        { error: 'No se puede cambiar la contraseña de miembros de la Cúpula Directiva' },
        { status: 403 }
      );
    }

    // Hashear la nueva contraseña
    const hashedPassword = await hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Registrar en auditoría con detalles enriquecidos
    const ipAddress = 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      undefined;

    const auditDetails = buildPasswordChangeDetails(
      {
        id: currentUser.id,
        username: currentUser.habboName,
        habboName: currentUser.habboName,
        rankId: currentUser.rankId,
      },
      {
        id: targetUser.id,
        username: targetUser.habboName,
        habboName: targetUser.habboName,
        rankId: targetUser.rankId,
      },
      reason.trim()
    );

    await createAuditLog({
      userId: currentUser.id,
      action: 'USER_RANK_CHANGED', // Note: We'll need to add USER_PASSWORD_CHANGED to the enum
      entityType: 'User',
      entityId: id,
      details: auditDetails as unknown as Record<string, unknown>,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
