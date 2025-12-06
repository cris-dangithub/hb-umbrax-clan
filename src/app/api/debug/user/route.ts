import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-current-user'

/**
 * GET /api/debug/user
 * Endpoint de debugging para verificar datos del usuario actual
 * IMPORTANTE: Deshabilitar en producción
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ 
        error: 'No user session found',
        user: null 
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        habboName: user.habboName,
        rankId: user.rankId,
        isSovereign: user.isSovereign,
        rank: {
          id: user.rank.id,
          name: user.rank.name,
          order: user.rank.order,
          icon: user.rank.icon
        }
      },
      conditions: {
        'rank.order <= 3': user.rank.order <= 3,
        'isSovereign': user.isSovereign,
        'shouldShowAdmin': (user.rank.order <= 3 || user.isSovereign)
      }
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
