import { getCurrentUser } from '@/lib/get-current-user'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NoticiasPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-4 sm:pt-24 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8" style={{ backgroundColor: '#0f0f0f' }}>
      <div className="max-w-7xl mx-auto">
        <div
          className="backdrop-blur-md rounded-lg shadow-2xl p-6 mb-8"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.8)',
            border: '2px solid #CC933B',
          }}
        >
          <h1
            className="text-2xl mb-4"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
            }}
          >
            📰 NOTICIAS DEL CLAN
          </h1>
          <p
            className="text-lg mb-6"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            Últimas noticias y anuncios importantes del clan NOVAX.
          </p>
          <p
            className="text-base mb-4"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#CC933B',
            }}
          >
            Esta funcionalidad estará disponible próximamente.
          </p>
          <Link href="/dashboard">
            <button
              className="px-6 py-3 rounded font-bold text-black transition-all hover:scale-105"
              style={{
                backgroundColor: '#CC933B',
                fontFamily: 'Rajdhani, sans-serif',
              }}
            >
              ← Volver al Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
