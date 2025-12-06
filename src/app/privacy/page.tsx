import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Contenedor principal */}
      <div className="max-w-4xl mx-auto">
        <div
          className="backdrop-blur-md rounded-lg shadow-2xl p-8"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.8)',
            border: '2px solid #CC933B',
          }}
        >
          {/* Título */}
          <h1
            className="text-center text-3xl mb-8"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#CC933B',
              textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
            }}
          >
            POLÍTICA DE PRIVACIDAD
          </h1>

          {/* Contenido */}
          <div
            className="space-y-6 text-base leading-relaxed"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            <p className="text-lg" style={{ color: '#CC933B' }}>
              <strong>UMBRAX CLAN</strong> - Última actualización: Diciembre 2025
            </p>

            {/* Sección 1 */}
            <section>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: '#CC933B' }}
              >
                1. Información que Recopilamos
              </h2>
              <p>
                Al registrarte en la plataforma de UMBRAX CLAN, recopilamos la
                siguiente información:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>
                  <strong>Nombre de usuario de Habbo Hotel:</strong> Utilizado
                  para vincular tu cuenta con tu perfil en Habbo.
                </li>
                <li>
                  <strong>Contraseña:</strong> Almacenada de forma segura
                  mediante hash criptográfico (bcrypt). Nunca almacenamos
                  contraseñas en texto plano.
                </li>
                <li>
                  <strong>Dirección IP:</strong> Solo capturamos tu dirección
                  IP <strong>una vez durante el registro</strong> con el
                  propósito de prevenir cuentas duplicadas fraudulentas y
                  mantener la integridad del clan.
                </li>
                <li>
                  <strong>Avatar de Habbo:</strong> URL pública de tu avatar
                  obtenida desde los servidores oficiales de Habbo Hotel.
                </li>
              </ul>
            </section>

            {/* Sección 2 */}
            <section>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: '#CC933B' }}
              >
                2. Uso de la Información
              </h2>
              <p>La información recopilada se utiliza exclusivamente para:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Gestionar tu cuenta y acceso a la plataforma.</li>
                <li>Verificar tu identidad como miembro del clan.</li>
                <li>
                  Prevenir registros múltiples y actividades fraudulentas.
                </li>
                <li>
                  Mostrar tu avatar y rango dentro de la jerarquía de NOVAX.
                </li>
                <li>
                  Facilitar la comunicación y gestión interna del clan.
                </li>
              </ul>
            </section>

            {/* Sección 3 */}
            <section>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: '#CC933B' }}
              >
                3. Almacenamiento de Dirección IP
              </h2>
              <p>
                <strong>Importante:</strong> Tu dirección IP es capturada{' '}
                <strong>únicamente durante el proceso de registro</strong>. No
                rastreamos tu actividad posterior ni actualizamos esta
                información en sesiones futuras.
              </p>
              <p className="mt-2">
                Esta medida es temporal y está diseñada para prevenir abusos.
                En el futuro, la política de almacenamiento de IP puede
                cambiar, y se notificará con antelación a todos los miembros.
              </p>
            </section>

            {/* Sección 4 */}
            <section>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: '#CC933B' }}
              >
                4. Seguridad de los Datos
              </h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas
                para proteger tu información:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>
                  Las contraseñas se almacenan usando hash bcrypt con salt de
                  10 rondas.
                </li>
                <li>
                  Las sesiones utilizan cookies seguras con iron-session y
                  cifrado robusto.
                </li>
                <li>
                  El acceso a la base de datos está restringido y protegido.
                </li>
                <li>
                  No compartimos tu información con terceros sin tu
                  consentimiento explícito.
                </li>
              </ul>
            </section>

            {/* Sección 5 */}
            <section>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: '#CC933B' }}
              >
                5. Tus Derechos
              </h2>
              <p>Como miembro de UMBRAX CLAN, tienes derecho a:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Acceder a la información que tenemos sobre ti.</li>
                <li>Solicitar la corrección de datos incorrectos.</li>
                <li>
                  Solicitar la eliminación de tu cuenta y datos asociados.
                </li>
                <li>Retirar tu consentimiento en cualquier momento.</li>
              </ul>
              <p className="mt-2">
                Para ejercer estos derechos, contacta a un administrador de
                rango superior dentro del clan.
              </p>
            </section>

            {/* Sección 6 */}
            <section>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: '#CC933B' }}
              >
                6. Validación con Habbo Hotel
              </h2>
              <p>
                Al registrarte, validamos tu nombre de usuario contra la API
                oficial de Habbo Hotel para verificar que el usuario existe. No
                tenemos afiliación oficial con Sulake Corporation (Habbo Hotel)
                y no almacenamos información adicional más allá de tu nombre de
                usuario público y la URL de tu avatar.
              </p>
            </section>

            {/* Sección 7 */}
            <section>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: '#CC933B' }}
              >
                7. Cambios en la Política
              </h2>
              <p>
                UMBRAX CLAN se reserva el derecho de actualizar esta política de
                privacidad en cualquier momento. Los cambios serán comunicados
                a través de la plataforma y entrarán en vigencia inmediatamente
                tras su publicación.
              </p>
            </section>

            {/* Sección 8 */}
            <section>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: '#CC933B' }}
              >
                8. Contacto
              </h2>
              <p>
                Si tienes preguntas sobre esta política de privacidad o sobre
                cómo manejamos tus datos, contacta a la administración del clan
                a través de los canales oficiales en Habbo Hotel.
              </p>
            </section>
          </div>

          {/* Botones de acción */}
          <div className="mt-10 flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 rounded font-bold text-black transition-all hover:scale-105"
              style={{
                backgroundColor: '#CC933B',
                fontFamily: 'Rajdhani, sans-serif',
                border: '2px solid #CC933B',
              }}
            >
              Volver al Registro
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: 'transparent',
                color: '#CC933B',
                fontFamily: 'Rajdhani, sans-serif',
                border: '2px solid #CC933B',
              }}
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
