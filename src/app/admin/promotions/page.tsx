import { redirect } from 'next/navigation'
import { getCurrentUser, hasAdminAccess } from '@/lib/get-current-user'

export default async function AdminPromotionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/?modal=login')
  }

  const adminAccess = await hasAdminAccess()
  if (!adminAccess) {
    redirect('/dashboard')
  }

  const hasFullAccess = user.rank.order <= 3

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="backdrop-blur-md rounded-lg p-6 sm:p-8 mb-6"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.8)',
            border: '2px solid #CC933B',
          }}
        >
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              textShadow: '0 0 20px rgba(204, 147, 59, 0.5)',
            }}
          >
            SOLICITUDES DE ASCENSO
          </h1>
          <p
            className="text-sm sm:text-base"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            {hasFullAccess
              ? 'Gestiona todas las solicitudes de ascenso del clan'
              : 'Gestiona solicitudes de ascenso a tu rango'}
          </p>
        </div>

        {/* Content Card */}
        <div
          className="backdrop-blur-md rounded-lg p-6 sm:p-8"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.8)',
            border: '2px solid #CC933B',
          }}
        >
          <div className="text-center py-12">
            <p
              className="text-lg mb-4"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#CC933B',
              }}
            >
              🚧 En Construcción 🚧
            </p>
            <p
              className="text-sm"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              Sistema de promociones disponible próximamente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
