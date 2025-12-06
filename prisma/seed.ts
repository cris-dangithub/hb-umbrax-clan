import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌑 Iniciando seed de UMBRAX CLAN...')

  // Crear los 10 rangos jerárquicos del clan
  const ranks = [
    {
      id: 1,
      name: 'Gran señor de las sombras',
      order: 1,
      roleDescription:
        'Autoridad suprema del clan NOVAX. Acceso total a todas las funciones administrativas y operativas. Toma decisiones estratégicas finales y representa al clan ante otras organizaciones.',
      icon: 'crown',
    },
    {
      id: 2,
      name: 'Sombra maestra',
      order: 2,
      roleDescription:
        'Mano derecha del Gran Señor. Gestión administrativa completa y supervisión de todos los rangos inferiores. Coordina operaciones del clan y actúa como líder en ausencia del supremo.',
      icon: 'star',
    },
    {
      id: 3,
      name: 'Embajador omega',
      order: 3,
      roleDescription:
        'Ejecutor de misiones especiales y organizador de eventos del clan. Responsable de la representación externa, alianzas estratégicas y creación de actividades para los miembros.',
      icon: 'shield',
    },
    {
      id: 4,
      name: 'Acechador nocturno',
      order: 4,
      roleDescription:
        'Moderación y vigilancia del chat y ambiente del clan. Garantiza el cumplimiento de las reglas internas y mantiene el orden en las salas oficiales. Supervisa el comportamiento de los miembros.',
      icon: 'eye',
    },
    {
      id: 5,
      name: 'Maestro del eclipse',
      order: 5,
      roleDescription:
        'Supervisor de roles y cumplimiento de misiones asignadas. Evalúa el desempeño de los miembros y recomienda ascensos o sanciones. Coordina con otros rangos medios para optimizar operaciones.',
      icon: 'moon',
    },
    {
      id: 6,
      name: 'Explorador oscuro',
      order: 6,
      roleDescription:
        'Mensajería e inteligencia del clan. Recopila información estratégica sobre otros clanes y eventos en Habbo. Mantiene la comunicación fluida entre diferentes niveles jerárquicos.',
      icon: 'compass',
    },
    {
      id: 7,
      name: 'Guardián de las sombras',
      order: 7,
      roleDescription:
        'Seguridad y control de accesos a las salas del clan. Actúa como portero verificando la identidad de visitantes y protegiendo las instalaciones. Primer nivel de defensa del clan.',
      icon: 'lock',
    },
    {
      id: 8,
      name: 'Sombra silenciosa',
      order: 8,
      roleDescription:
        'Eliminación de traidores y espionaje interno. Opera en las sombras identificando amenazas y filtraciones. Ejecuta misiones encubiertas bajo órdenes de rangos superiores.',
      icon: 'ghost',
    },
    {
      id: 9,
      name: 'Maestro de cuchillas',
      order: 9,
      roleDescription:
        'Instructor de reclutas y gestor del proceso de onboarding. Capacita a nuevos miembros en las normas, estructura y valores del clan. Evalúa si los reclutas están listos para ascender.',
      icon: 'sword',
    },
    {
      id: 10,
      name: 'Sombra aprendiz',
      order: 10,
      roleDescription:
        'Recluta en periodo de prueba. Acceso limitado solo a lectura y observación. Debe demostrar lealtad, compromiso y habilidades antes de ser considerado para ascenso.',
      icon: 'user',
    },
  ]

  console.log('📊 Creando rangos...')

  for (const rank of ranks) {
    await prisma.rank.upsert({
      where: { id: rank.id },
      update: rank,
      create: rank,
    })
    console.log(`  ✓ ${rank.name} (Orden: ${rank.order})`)
  }

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('🌑 UMBRAX CLAN está listo para dominar las sombras...\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
