import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasAdminAccess } from '@/lib/get-current-user'
import { prisma } from '@/lib/prisma'
import UserTable from '@/components/UserTable'

export default async function AdminUsersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/?modal=login')
  }

  const adminAccess = await hasAdminAccess()
  if (!adminAccess) {
    redirect('/dashboard')
  }

  // Obtener estadísticas
  const [totalUsers, sovereigns, cupulaMembers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isSovereign: true } }),
    prisma.user.count({ where: { rank: { order: { lte: 3 } } } }),
  ])

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-12" style={{ backgroundColor: '#0f0f0f' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="backdrop-blur-md rounded-lg p-6 sm:p-8 mb-6"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.8)',
            border: '2px solid #CC933B',
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#CC933B',
                  textShadow: '0 0 20px rgba(204, 147, 59, 0.5)',
                  fontSize: 'clamp(16px, 3vw, 24px)',
                }}
              >
                GESTIÓN DE USUARIOS
              </h1>
              <p
                className="text-sm sm:text-base"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                }}
              >
                Panel de administración completo para la Cúpula Directiva
              </p>
            </div>
            <Link href="/dashboard">
              <button
                className="px-4 py-2 rounded transition-all hover:scale-105"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#CC933B',
                  border: '1px solid #CC933B',
                }}
              >
                ← Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            className="backdrop-blur-md rounded-lg p-6"
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.8)',
              border: '2px solid #CC933B',
            }}
          >
            <p
              className="text-sm mb-2"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              Total de Usuarios
            </p>
            <p
              className="text-3xl font-bold"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
              }}
            >
              {totalUsers}
            </p>
          </div>

          <div
            className="backdrop-blur-md rounded-lg p-6"
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.8)',
              border: '2px solid #CC933B',
            }}
          >
            <p
              className="text-sm mb-2"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              Soberanos
            </p>
            <p
              className="text-3xl font-bold"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
              }}
            >
              {sovereigns}
            </p>
          </div>

          <div
            className="backdrop-blur-md rounded-lg p-6"
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.8)',
              border: '2px solid #CC933B',
            }}
          >
            <p
              className="text-sm mb-2"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              Cúpula Directiva
            </p>
            <p
              className="text-3xl font-bold"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
              }}
            >
              {cupulaMembers}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div
          className="backdrop-blur-md rounded-lg p-6 sm:p-8"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.8)',
            border: '2px solid #CC933B',
          }}
        >
          <h2
            className="text-xl mb-6"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              fontSize: 'clamp(14px, 2.5vw, 16px)',
            }}
          >
            TABLA DE USUARIOS
          </h2>

          <UserTable />
        </div>
      </div>
    </div>
  )
}
