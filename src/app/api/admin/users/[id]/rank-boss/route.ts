import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';

const sovereignSchema = z.object({
  isSovereign: z.boolean(),
  reason: z
    .string()
    .min(10, 'La razón debe tener al menos 10 caracteres'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    // Validar sesión
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo rangos 1, 2 y 3 pueden gestionar soberanos
    if (currentUser.rank.order > 3) {
      return NextResponse.json(
        { error: 'Solo la Cúpula Directiva puede gestionar soberanos' },
        { status: 403 }
      );
    }

    // Validar body
    const body = await request.json();
    const validation = sovereignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de entrada inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { isSovereign, reason } = validation.data;

    // Obtener usuario objetivo
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { rank: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario objetivo no encontrado' },
        { status: 404 }
      );
    }

    // No se puede modificar a usuarios de rango superior
    if (targetUser.rank.order < currentUser.rank.order) {
      return NextResponse.json(
        { error: 'No puedes modificar a usuarios de rango superior' },
        { status: 403 }
      );
    }

    // Verificar si hay cambios reales
    if (targetUser.isSovereign === isSovereign) {
      return NextResponse.json(
        {
          error: isSovereign
            ? 'El usuario ya es soberano'
            : 'El usuario ya es súbdito',
        },
        { status: 400 }
      );
    }

    // Actualizar estado de soberano
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isSovereign },
      include: { rank: true },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: isSovereign ? 'USER_SOVEREIGN_ASSIGNED' : 'USER_SOVEREIGN_REMOVED',
        entityType: 'User',
        entityId: id,
        details: JSON.stringify({
          targetUser: targetUser.habboName,
          targetUserId: id,
          previousState: targetUser.isSovereign,
          newState: isSovereign,
          rank: targetUser.rank.name,
          rankOrder: targetUser.rank.order,
          reason,
          executor: currentUser.habboName,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: isSovereign
        ? 'Usuario nombrado como soberano exitosamente'
        : 'Usuario degradado a súbdito exitosamente',
      user: {
        id: updatedUser.id,
        habboName: updatedUser.habboName,
        isSovereign: updatedUser.isSovereign,
        rank: updatedUser.rank,
      },
    });
  } catch (error) {
    console.error('Error updating rank boss status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
