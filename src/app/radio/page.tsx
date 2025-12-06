import { Radio } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function RadioPage() {
  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#0f0f0f' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          className="backdrop-blur-md rounded-lg shadow-2xl p-8 sm:p-12 text-center"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.9)',
            border: '2px solid #CC933B',
          }}
        >
          <div className="flex justify-center mb-6">
            <Radio
              className="w-16 h-16 sm:w-24 sm:h-24"
              style={{ color: '#CC933B' }}
            />
          </div>

          <h1
            className="text-3xl sm:text-4xl mb-6"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              textShadow: '0 0 20px rgba(204, 147, 59, 0.5)',
              fontSize: 'clamp(18px, 4vw, 32px)',
            }}
          >
            NOVAX RADIO
          </h1>

          <p
            className="text-xl sm:text-2xl mb-8"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
              fontWeight: 600,
            }}
          >
            Próximamente
          </p>

          <p
            className="text-base sm:text-lg max-w-2xl mx-auto mb-8"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#CC933B',
              lineHeight: '1.8',
            }}
          >
            La radio oficial de UMBRAX CLAN estará disponible próximamente. Aquí podrás escuchar música,
            programas especiales y anuncios importantes del clan.
          </p>

          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: 'rgba(74, 12, 17, 0.3)',
              border: '2px solid #CC933B',
            }}
          >
            <p
              className="text-sm"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
              }}
            >
              🎵 Transmisiones en vivo<br />
              🎙️ Programas exclusivos del clan<br />
              📻 Música seleccionada por los líderes<br />
              📢 Anuncios y eventos especiales
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
