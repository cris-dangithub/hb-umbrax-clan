import { getCurrentUser } from '@/lib/get-current-user'
import { prisma } from '@/lib/prisma'
import { Calendar, Users, Newspaper, ExternalLink, MessageCircle, Twitter, Music } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import HabboAvatar from '@/components/HabboAvatar'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getCurrentUser()
  
  // Fetch high-rank users (order <= 3)
  const highRankUsers = await prisma.user.findMany({
    where: {
      rank: {
        order: {
          lte: 3
        }
      }
    },
    include: {
      rank: true
    },
    orderBy: {
      rank: {
        order: 'asc'
      }
    },
    take: 6
  })

  // Placeholder news data - will be replaced with real data later
  const placeholderNews = [
    {
      id: '1',
      title: 'Próximo Evento: Misión Nocturna',
      category: 'EVENTO',
      date: 'Diciembre 10, 2025',
      excerpt: 'Se requiere la presencia de todos los miembros para la gran misión de infiltración...'
    },
    {
      id: '2',
      title: 'Nuevos Ascensos en el Clan',
      category: 'MILITAR',
      date: 'Diciembre 8, 2025',
      excerpt: 'Felicitaciones a los miembros que han demostrado su valor y han sido ascendidos...'
    },
    {
      id: '3',
      title: 'Actualización de Normas',
      category: 'GENERAL',
      date: 'Diciembre 5, 2025',
      excerpt: 'Se han actualizado las normas del clan. Todos los miembros deben revisar...'
    }
  ]

  const externalLinks = [
    { name: 'Discord', url: 'https://discord.gg/3fvQkUFf', IconComponent: MessageCircle, color: '#5865F2' },
    // { name: 'X (Twitter)', url: '#', IconComponent: Twitter, color: '#1DA1F2' },
    // { name: 'TikTok', url: '#', IconComponent: Music, color: '#EE1D52' },
  ]

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl mb-6"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              textShadow: '0 0 20px rgba(204, 147, 59, 0.5)',
              fontSize: 'clamp(24px, 5vw, 48px)',
            }}
          >
            UMBRAX CLAN
          </h1>
          <p
            className="text-xl sm:text-2xl mb-4"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
              fontWeight: 600,
            }}
          >
            La Élite de las Sombras
          </p>
          <p
            className="text-base sm:text-lg mb-8 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#CC933B',
              lineHeight: '1.8',
            }}
          >
            Organización de élite en Habbo Hotel con una jerarquía mística y sombría.
            Únete a nosotros y asciende desde Sombra Aprendiz hasta convertirte en el Gran Señor de las Sombras.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        {/* News/Events Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl sm:text-3xl font-bold flex items-center gap-3"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
                textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
                fontSize: 'clamp(14px, 3vw, 20px)',
              }}
            >
              <Newspaper className="w-6 h-6 sm:w-8 sm:h-8" />
              Noticias y Eventos
            </h2>
            <Link
              href="/eventos"
              className="text-sm px-4 py-2 rounded transition-all hover:scale-105"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#CC933B',
                border: '1px solid #CC933B',
              }}
            >
              Ver todos
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {placeholderNews.length > 0 ? (
              placeholderNews.map((news) => (
                <div
                  key={news.id}
                  className="backdrop-blur-md rounded-lg shadow-xl p-6 transition-all hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(15, 15, 15, 0.8)',
                    border: '2px solid #CC933B',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'rgba(204, 147, 59, 0.2)',
                        color: '#CC933B',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 'bold',
                      }}
                    >
                      {news.category}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: '#ededed',
                        fontFamily: 'Rajdhani, sans-serif',
                      }}
                    >
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {news.date}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: '#CC933B',
                    }}
                  >
                    {news.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: '#ededed',
                      lineHeight: '1.6',
                    }}
                  >
                    {news.excerpt}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p
                  className="text-xl font-bold"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                  }}
                >
                  Próximamente
                </p>
                <p
                  className="text-sm mt-2"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#ededed',
                  }}
                >
                  Nuevas noticias y eventos del clan estarán disponibles pronto
                </p>
              </div>
            )}
          </div>
        </section>

        {/* High Rank Members & External Links Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* High Rank Members */}
          <section className="lg:col-span-2">
            <h2
              className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-6"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
                textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
                fontSize: 'clamp(14px, 3vw, 20px)',
              }}
            >
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              Liderazgo del Clan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highRankUsers.length > 0 ? (
                highRankUsers.map((member: any) => (
                  <div
                    key={member.id}
                    className="backdrop-blur-md rounded-lg shadow-xl p-4 flex items-center gap-4"
                    style={{
                      backgroundColor: 'rgba(74, 12, 17, 0.3)',
                      border: '2px solid #CC933B',
                    }}
                  >
                    <HabboAvatar
                      src={member.avatarUrl}
                      alt={member.habboName}
                      size={64}
                    />
                    <div className="flex-1">
                      <p
                        className="font-bold text-base"
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          color: '#CC933B',
                        }}
                      >
                        {member.habboName}
                      </p>
                      <p
                        className="text-sm"
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          color: '#ededed',
                        }}
                      >
                        {member.rank.icon} {member.rank.name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p
                  className="col-span-2 text-center py-8"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                  }}
                >
                  No hay miembros de alto rango disponibles
                </p>
              )}
            </div>
          </section>

          {/* External Links */}
          <section>
            <h2
              className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-6"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
                textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
                fontSize: 'clamp(14px, 3vw, 20px)',
              }}
            >
              <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8" />
              Comunidad
            </h2>

            <div className="space-y-4">
              {externalLinks.map((link) => {
                const Icon = link.IconComponent
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="backdrop-blur-md rounded-lg shadow-xl p-4 flex items-center gap-4 transition-all hover:scale-105"
                    style={{
                      backgroundColor: 'rgba(15, 15, 15, 0.8)',
                      border: '2px solid #CC933B',
                    }}
                  >
                    <Icon className="w-8 h-8" style={{ color: '#CC933B' }} />
                    <div className="flex-1">
                      <p
                        className="font-bold"
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          color: '#CC933B',
                        }}
                      >
                        {link.name}
                      </p>
                      <p
                        className="text-sm"
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          color: '#ededed',
                        }}
                      >
                        Únete a la conversación
                      </p>
                    </div>
                    <ExternalLink className="w-5 h-5" style={{ color: '#CC933B' }} />
                  </a>
                )
              })}
            </div>

            {/* CTA Card */}
            {!user && (
              <div
                className="backdrop-blur-md rounded-lg shadow-xl p-6 mt-6"
                style={{
                  backgroundColor: 'rgba(74, 12, 17, 0.3)',
                  border: '2px solid #CC933B',
                }}
              >
                <h3
                  className="text-lg font-bold mb-3"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                  }}
                >
                  ¿Listo para unirte?
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#ededed',
                  }}
                >
                  Conviértete en parte de la élite de las sombras
                </p>
                <Link
                  href="?modal=register"
                  className="block w-full py-3 rounded font-bold text-center transition-all hover:scale-105"
                  style={{
                    backgroundColor: '#CC933B',
                    color: '#0f0f0f',
                    fontFamily: 'Rajdhani, sans-serif',
                    border: '2px solid #CC933B',
                  }}
                >
                  UNIRSE AHORA
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Footer Info */}
        <section className="text-center pt-8 border-t" style={{ borderColor: 'rgba(204, 147, 59, 0.3)' }}>
          <p
            className="text-sm mb-2"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            Plataforma oficial de gestión para miembros de UMBRAX CLAN
          </p>
          <p
            className="text-xs"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#CC933B',
            }}
          >
            No afiliado oficialmente con Sulake Corporation Oy (Habbo Hotel)
          </p>
        </section>
      </div>
    </div>
  )
}
