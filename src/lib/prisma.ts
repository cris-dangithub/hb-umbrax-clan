import { PrismaClient } from '@prisma/client'

// Prevenir múltiples instancias de PrismaClient en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configuración optimizada para Neon PostgreSQL
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
