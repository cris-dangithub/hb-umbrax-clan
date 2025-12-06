import { PrismaClient } from '@prisma/client'

// Prevenir múltiples instancias de PrismaClient en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configuración optimizada para serverless (Vercel + Neon)
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Importante: No llamar prisma.$disconnect() en serverless
// Las conexiones se reutilizan entre invocaciones cuando el container está "warm"
