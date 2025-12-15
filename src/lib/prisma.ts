import { PrismaClient } from '@prisma/client'

// Prevenir múltiples instancias de PrismaClient en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

const createPrismaClient = () => {
  // Verificación crítica: asegurar que DATABASE_URL existe
  if (!process.env.DATABASE_URL) {
    throw new Error(
      '❌ DATABASE_URL no está definida. Verifica las variables de entorno en Vercel.'
    )
  }

  console.log('[Prisma] Inicializando con DATABASE_URL:', 
    process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') // Ocultar password en logs
  )

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configuración optimizada para Neon PostgreSQL en Vercel
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        // Auto-reconectar en caso de error de conexión
        return query(args).catch(async (error) => {
          if (error.message?.includes('connection') || error.message?.includes('Closed')) {
            console.log(`[Prisma] Reconectando después de error: ${error.message}`)
            // Reintentar una vez
            return query(args)
          }
          throw error
        })
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Importante: No llamar prisma.$disconnect() en serverless
// Las conexiones se reutilizan entre invocaciones cuando el container está "warm"
