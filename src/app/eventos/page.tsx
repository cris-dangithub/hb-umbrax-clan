import { Calendar, Clock, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function EventosPage() {
  // Placeholder events data
  const upcomingEvents = [
    {
      id: '1',
      title: 'Misión Nocturna: Infiltración',
      date: 'Diciembre 10, 2025',
      time: '20:00 GMT-5',
      location: 'Sala de Operaciones',
      category: 'MILITAR',
      description: 'Operación especial de infiltración. Asistencia obligatoria para rangos 4+',
    },
    {
      id: '2',
      title: 'Ceremonia de Ascensos',
      date: 'Diciembre 15, 2025',
      time: '19:00 GMT-5',
      location: 'Salón Principal',
      category: 'CEREMONIA',
      description: 'Reconocimiento oficial de nuevos ascensos en el clan',
    },
    {
      id: '3',
      title: 'Entrenamiento de Reclutas',
      date: 'Diciembre 12, 2025',
      time: '18:00 GMT-5',
      location: 'Campo de Entrenamiento',
      category: 'ENTRENAMIENTO',
      description: 'Sesión de entrenamiento para Sombras Aprendiz',
    },
  ]

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
            📅 EVENTOS DEL CLAN
          </h1>
          <p
            className="text-base sm:text-lg"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            Calendario de próximos eventos y actividades
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="backdrop-blur-md rounded-lg shadow-xl p-6 transition-all hover:scale-105"
              style={{
                backgroundColor: 'rgba(15, 15, 15, 0.9)',
                border: '2px solid #CC933B',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="text-xs px-3 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(204, 147, 59, 0.2)',
                    color: '#CC933B',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 'bold',
                  }}
                >
                  {event.category}
                </span>
              </div>

              <h3
                className="text-xl font-bold mb-3"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#CC933B',
                }}
              >
                {event.title}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: '#CC933B' }} />
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: '#ededed',
                    }}
                  >
                    {event.date}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#CC933B' }} />
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: '#ededed',
                    }}
                  >
                    {event.time}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: '#CC933B' }} />
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: '#ededed',
                    }}
                  >
                    {event.location}
                  </span>
                </div>
              </div>

              <p
                className="text-sm"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                  lineHeight: '1.6',
                }}
              >
                {event.description}
              </p>
            </div>
          ))}
        </div>

        {/* Calendar Section (Coming Soon) */}
        <div
          className="backdrop-blur-md rounded-lg shadow-2xl p-8 text-center"
          style={{
            backgroundColor: 'rgba(74, 12, 17, 0.3)',
            border: '2px solid #CC933B',
          }}
        >
          <Calendar
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: '#CC933B' }}
          />
          <h2
            className="text-xl sm:text-2xl mb-3"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
              fontSize: 'clamp(14px, 3vw, 18px)',
            }}
          >
            Calendario Interactivo
          </h2>
          <p
            className="text-base"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            Próximamente: Vista de calendario completa con recordatorios y sincronización
          </p>
        </div>
      </div>
    </div>
  )
}
