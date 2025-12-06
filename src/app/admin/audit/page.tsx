import { redirect } from 'next/navigation'
import { getCurrentUser, hasFullAccess } from '@/lib/get-current-user'

export default async function AdminAuditPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/?modal=login')
  }

  const fullAccess = await hasFullAccess()
  if (!fullAccess) {
    redirect('/dashboard')
  }

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
            LOGS DE AUDITORÍA
          </h1>
          <p
            className="text-sm sm:text-base"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            Registro completo de todas las acciones administrativas
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
              📋 Sistema de Auditoría Completo
            </p>
            <p
              className="text-sm mb-6"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              Todas las acciones están siendo registradas:
            </p>
            <ul
              className="space-y-2 text-sm text-left max-w-md mx-auto"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              <li>✅ Cambios de rango</li>
              <li>✅ Asignación de soberanos</li>
              <li>✅ Creación y revisión de solicitudes</li>
              <li>✅ Eliminación de usuarios</li>
              <li>✅ Inicios de sesión y registros</li>
            </ul>
            <p
              className="text-xs mt-6"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#CC933B',
              }}
            >
              Vista de logs disponible próximamente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
