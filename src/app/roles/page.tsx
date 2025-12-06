import { prisma } from '@/lib/prisma'
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  // Fetch all ranks from database
  const ranks = await prisma.rank.findMany({
    orderBy: {
      order: 'asc'
    }
  })

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#0f0f0f' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              textShadow: '0 0 20px rgba(204, 147, 59, 0.5)',
              fontSize: 'clamp(18px, 4vw, 32px)',
            }}
          >
            👑 JERARQUÍA DEL CLAN
          </h1>
          <p
            className="text-base sm:text-lg max-w-3xl mx-auto"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            Sistema de 10 rangos de UMBRAX CLAN, desde Sombra Aprendiz hasta Gran Señor de las Sombras.
            Cada rango otorga diferentes responsabilidades y permisos dentro de la organización.
          </p>
        </div>

        {/* Ranks List */}
        <div className="space-y-4">
          {ranks.map((rank: any) => {
            // Determine rank tier color
            const isTopTier = rank.order <= 2
            const isHighTier = rank.order <= 5
            const backgroundColor = isTopTier
              ? 'rgba(204, 147, 59, 0.15)'
              : isHighTier
              ? 'rgba(74, 12, 17, 0.3)'
              : 'rgba(15, 15, 15, 0.9)'
            
            const borderStyle = isTopTier
              ? '3px solid #CC933B'
              : '2px solid #CC933B'

            return (
              <div
                key={rank.id}
                className="backdrop-blur-md rounded-lg shadow-xl p-6 transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor,
                  border: borderStyle,
                  boxShadow: isTopTier ? '0 0 20px rgba(204, 147, 59, 0.3)' : undefined,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Rank Number & Icon */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: 'rgba(204, 147, 59, 0.2)',
                        border: '2px solid #CC933B',
                      }}
                    >
                      <span
                        className="font-bold"
                        style={{
                          fontFamily: '"Press Start 2P", cursive',
                          color: '#CC933B',
                          fontSize: '14px',
                        }}
                      >
                        {rank.order}
                      </span>
                    </div>

                    <span className="text-3xl">{rank.icon}</span>
                  </div>

                  {/* Rank Info */}
                  <div className="flex-1">
                    <h3
                      className="text-xl font-bold mb-2"
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        color: '#CC933B',
                        textShadow: isTopTier ? '0 0 10px rgba(204, 147, 59, 0.5)' : undefined,
                      }}
                    >
                      {rank.name}
                    </h3>
                    <p
                      className="text-sm sm:text-base"
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        color: '#ededed',
                        lineHeight: '1.6',
                      }}
                    >
                      {rank.roleDescription}
                    </p>
                  </div>

                  {/* Tier Badge */}
                  {isTopTier && (
                    <div className="flex items-center gap-2">
                      <Shield
                        className="w-6 h-6"
                        style={{ color: '#CC933B' }}
                      />
                      <span
                        className="text-xs font-bold"
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          color: '#CC933B',
                        }}
                      >
                        ÉLITE
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Permissions Info */}
        <div
          className="backdrop-blur-md rounded-lg shadow-2xl p-8 mt-12"
          style={{
            backgroundColor: 'rgba(74, 12, 17, 0.3)',
            border: '2px solid #CC933B',
          }}
        >
          <h2
            className="text-xl sm:text-2xl mb-6"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
              fontSize: 'clamp(14px, 3vw, 18px)',
            }}
          >
            Sistema de Permisos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3
                className="font-bold mb-2"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#CC933B',
                }}
              >
                Rangos 1-2: Administración Total
              </h3>
              <p
                className="text-sm"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                }}
              >
                Control total del clan, gestión de ascensos, crear eventos y administrar todos los miembros
              </p>
            </div>

            <div>
              <h3
                className="font-bold mb-2"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#CC933B',
                }}
              >
                Rangos 3-9: Gestión de Reclutas
              </h3>
              <p
                className="text-sm"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                }}
              >
                Supervisar y entrenar a nuevos miembros, gestionar actividades y reportar al liderazgo
              </p>
            </div>

            <div>
              <h3
                className="font-bold mb-2"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#CC933B',
                }}
              >
                Rango 10: Fase de Entrenamiento
              </h3>
              <p
                className="text-sm"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                }}
              >
                Acceso básico a la plataforma, participación en entrenamientos y eventos designados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
