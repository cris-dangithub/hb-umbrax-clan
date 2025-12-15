import { getCurrentUser } from '@/lib/get-current-user'
import { redirect } from 'next/navigation'
import UserProfileCard from '@/components/UserProfileCard'
import TimeRequestsCard from '@/components/TimeRequestsCard'
import SupervisorTimesTable from '@/components/SupervisorTimesTable'
import MyActiveTimeCard from '@/components/MyActiveTimeCard'
import { getUserTotalTimeMinutes } from '@/lib/time-tracking'
import { getActiveSession } from '@/lib/get-active-session'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Si no hay usuario (aunque el middleware debería manejarlo), redirigir
  if (!user) {
    redirect('/login')
  }

  // Obtener tiempo total acumulado
  const totalMinutes = await getUserTotalTimeMinutes(user.id);

  // Obtener sesión activa si existe
  const activeSession = await getActiveSession(user.id);

  return (
    <div className="min-h-screen pt-20 px-4 pb-4 sm:pt-24 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto">
        {/* Header del Dashboard */}
        <div
          className="backdrop-blur-md rounded-lg shadow-2xl p-4 sm:p-6 mb-6 sm:mb-8"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.8)',
            border: '2px solid #CC933B',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
            {/* User Profile - Left Column */}
            {/* <div className="flex flex-col sm:flex-row items-center gap-4">
              
            </div> */}
            <UserProfileCard
                userId={user.id}
                habboName={user.habboName}
                avatarUrl={user.avatarUrl}
                rankName={user.rank.name}
                rankOrder={user.rank.order}
                initialTotalMinutes={totalMinutes}
              />

              {/* Botón de logout */}
              <form action="/api/auth/logout" method="POST" className="w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded font-bold transition-all hover:scale-105 text-sm sm:text-base"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#CC933B',
                    fontFamily: 'Rajdhani, sans-serif',
                    border: '2px solid #CC933B',
                  }}
                >
                  Cerrar Sesión
                </button>
              </form>

            {/* Active Time Card - Right Column (Full Width on Mobile, Spans 1 Column on Desktop) */}
            <div className="sm:col-span-2">
              <MyActiveTimeCard
                userId={user.id}
                userName={user.habboName}
                avatarUrl={user.avatarUrl}
                rankName={user.rank.name}
                rankOrder={user.rank.order}
                missionPromotionGoal={user.rank.missionPromotionGoal}
                initialTotalMinutes={totalMinutes}
                initialActiveSession={activeSession}
                showBorder={false}
              />
            </div>
          </div>
        </div>
        

        {/* Contenido principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Card: Información del Rango */}
          <div
            className="backdrop-blur-md rounded-lg shadow-2xl p-4 sm:p-6 col-span-1 sm:col-span-2 xl:col-span-1"
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.8)',
              border: '2px solid #CC933B',
            }}
          >
            <h2
              className="text-base sm:text-xl mb-3 sm:mb-4"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
              }}
            >
              TU RANGO
            </h2>
            <p
              className="text-sm sm:text-base leading-relaxed"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              {user.rank.roleDescription}
            </p>
          </div>
          

          {/* Card: Gestión de Reclutas (Solo para Maestro de cuchillas o superior) */}
          {/* {user.rank.order <= 9 && (
            <div
              className="backdrop-blur-md rounded-lg shadow-2xl p-4 sm:p-6"
              style={{
                backgroundColor: 'rgba(74, 12, 17, 0.3)',
                border: '2px solid #CC933B',
              }}
            >
              <h2
                className="text-base sm:text-xl mb-3 sm:mb-4"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#CC933B',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                }}
              >
                RECLUTAS
              </h2>
              <p
                className="text-sm sm:text-base mb-3 sm:mb-4"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                }}
              >
                Gestiona y capacita a los nuevos miembros del clan.
              </p>
              <Link href="/dashboard/reclutas">
                <button
                  className="w-full py-2 sm:py-3 rounded font-bold text-black transition-all hover:scale-105 text-sm sm:text-base"
                  style={{
                    backgroundColor: '#CC933B',
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                >
                  Ver Reclutas
                </button>
              </Link>
            </div>
          )} */}

          {/* Card: Crear Evento/Noticia (Solo para Embajador o superior) */}
          {/* {user.rank.order <= 3 && (
            <div
              className="backdrop-blur-md rounded-lg shadow-2xl p-4 sm:p-6"
              style={{
                backgroundColor: 'rgba(74, 12, 17, 0.3)',
                border: '2px solid #CC933B',
              }}
            >
              <h2
                className="text-base sm:text-xl mb-3 sm:mb-4"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#CC933B',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                }}
              >
                EVENTOS
              </h2>
              <p
                className="text-sm sm:text-base mb-3 sm:mb-4"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                }}
              >
                Crea y gestiona eventos del clan.
              </p>
              <Link href="/dashboard/eventos">
                <button
                  className="w-full py-2 sm:py-3 rounded font-bold text-black transition-all hover:scale-105 text-sm sm:text-base"
                  style={{
                    backgroundColor: '#CC933B',
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                >
                  Crear Evento
                </button>
              </Link>
            </div>
          )} */}

        {/* Card: Administración (Cúpula y Soberanos) */}
        {/* {(user.rank.order <= 3 || user.isSovereign) && (
            <div
              className="backdrop-blur-md rounded-lg shadow-2xl p-4 sm:p-6"
              style={{
                backgroundColor: 'rgba(74, 12, 17, 0.3)',
                border: '2px solid #CC933B',
              }}
            >
              <h2
                className="text-base sm:text-xl mb-3 sm:mb-4"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#CC933B',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                }}
              >
                ADMIN
              </h2>
              <p
                className="text-sm sm:text-base mb-3 sm:mb-4"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                }}
              >
                Gestión de usuarios y solicitudes de time.
              </p>
              <Link href="/admin/users">
                <button
                  className="w-full py-2 sm:py-3 rounded font-bold text-black transition-all hover:scale-105 text-sm sm:text-base"
                  style={{
                    backgroundColor: '#CC933B',
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                >
                  Panel Admin
                </button>
              </Link>
            </div>
          )} */}

          {/* Card: Información General (Todos los rangos) */}
          {/* <div
            className="backdrop-blur-md rounded-lg shadow-2xl p-4 sm:p-6"
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.8)',
              border: '2px solid #CC933B',
            }}
          >
            <h2
              className="text-base sm:text-xl mb-3 sm:mb-4"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
              }}
            >
              NOTICIAS
            </h2>
            <p
              className="text-sm sm:text-base mb-3 sm:mb-4"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              Últimas noticias y anuncios del clan.
            </p>
            <Link href="/dashboard/noticias">
              <button
                className="w-full py-2 sm:py-3 rounded font-bold text-black transition-all hover:scale-105 text-sm sm:text-base"
                style={{
                  backgroundColor: '#CC933B',
                  fontFamily: 'Rajdhani, sans-serif',
                }}
              >
                Ver Noticias
              </button>
            </Link>
          </div> */}
        </div>

        {/* Time Tracking Section */}
        <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
          {/* Time Requests Card */}
          <TimeRequestsCard
            currentUserId={user.id}
            isSovereign={user.isSovereign || false}
            isCupula={user.rank.order <= 3}
            rankOrder={user.rank.order}
          />

          {/* Supervisor Times Table - For Supervisors (Soberanos/Cúpula) */}
          <SupervisorTimesTable
            currentUserId={user.id}
            isCupula={user.rank.order <= 3}
            isSovereign={user.isSovereign || false}
          />
        </div>
      </div>
    </div>
  )
}
