import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌑 Iniciando seed de UMBRAX CLAN...')

  // Crear los 13 rangos jerárquicos del clan
  const ranks = [
    {
      id: 1,
      name: 'Gran Líder',
      order: 1,
      roleDescription:
        'Máxima autoridad del clan. Ninguna persona está sobre él. Toma las decisiones más importantes y significativas del clan.',
      icon: 'crown',
    },
    {
      id: 2,
      name: 'Sombra Suprema',
      order: 2,
      roleDescription:
        'Mano derecha del "Gran Líder". Persona segunda al mando. Planifica y maneja los asuntos delicados del clan. Debe supervisar que todo funcione en orden y correctamente.',
      icon: 'star',
    },
    {
      id: 3,
      name: 'Ingeniero Abisal',
      order: 3,
      roleDescription:
        'Encargado del sistema digital del clan. Mantiene y protege la plataforma web y las operaciones técnicas desde las sombras.',
      icon: 'laptop',
    },
    {
      id: 4,
      name: 'Operador Omega',
      order: 4,
      roleDescription:
        'Ejecutor de misiones. Encargado de llevar operaciones críticas dentro del clan. Maneja y controla los eventos, sorteos y dinámicas cuando sea necesario.',
      icon: 'zap',
    },
    {
      id: 5,
      name: 'Acechador Nocturno',
      order: 5,
      roleDescription:
        'Vigilante del clan. Encargado de vigilar comportamientos y acciones de los miembros del clan. Encargado de velar por un buen ambiente entre los miembros, moderando el chat y comportamientos irrespetuosos.',
      icon: 'eye',
    },
    {
      id: 6,
      name: 'Maestro del Velo',
      order: 6,
      roleDescription:
        'Supervisor de roles. Encargado de velar por la buena ejecución de las misiones. Persona capacitada y entrenada para aclarar dudas de sombras inferiores.',
      icon: 'shield',
    },
    {
      id: 7,
      name: 'Consejo Umbral',
      order: 7,
      roleDescription:
        'Mensajero del clan. Encargado de transmitir y traer información de los altos cargos para que la información no se filtre. Consejero de los "Grandes Líderes".',
      icon: 'scroll',
    },
    {
      id: 8,
      name: 'Cegador del Silencio',
      order: 8,
      roleDescription:
        'Especialista en eliminaciones silenciosas de alto riesgo. Encargado de ejecutar y desmascarar a los traidores del clan. Debe velar que los miembros cumplan con su lealtad al clan y ejecutar a los traidores.',
      icon: 'sword',
    },
    {
      id: 9,
      name: 'Guía del Ocaso',
      order: 9,
      roleDescription:
        'Mentor que acompaña a los nuevos iniciados durante su transición hacia la verdadera oscuridad. Debe asegurar que cada iniciado se adapte a la base principal del clan.',
      icon: 'sunrise',
    },
    {
      id: 10,
      name: 'Registrador Umbrío',
      order: 10,
      roleDescription:
        'Archivista de las sombras. Debe enseñar en el proceso de registro y orientación de la web a las "sombras aprendiz".',
      icon: 'book',
    },
    {
      id: 11,
      name: 'Guardián de la Oscuridad',
      order: 11,
      roleDescription:
        'Protector del clan. Defiende el territorio y vela por la seguridad de los altos cargos. Debe verificar que los miembros porten sus placas correctamente y que sus procesos de ingreso estén correctos.',
      icon: 'shield-check',
    },
    {
      id: 12,
      name: 'Portador del Eclipse',
      order: 12,
      roleDescription:
        'Instructor de reclutas. Enseña tácticas y estrategias a los nuevos miembros. Encargado de los nuevos reclutas. Debe instruirlos en sus roles y darle las indicaciones correctas para ejecutar sus misiones.',
      icon: 'graduation-cap',
    },
    {
      id: 13,
      name: 'Sombra Aprendiz',
      order: 13,
      roleDescription:
        'Recluta nuevo del clan. Debe aprender sobre los diferentes rangos y roles y realiza tareas básicas para probar su lealtad. (Miembros nuevos)',
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
