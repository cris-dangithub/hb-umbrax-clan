#!/usr/bin/env node

/**
 * Script de verificación de variables de entorno críticas
 * Se ejecuta durante el build para detectar problemas temprano
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SESSION_SECRET',
  'JWT_SECRET',
  'NEXT_PUBLIC_WS_SERVER_URL'
];

console.log('🔍 Verificando variables de entorno...\n');

let hasErrors = false;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value) {
    console.error(`❌ ${varName}: NO DEFINIDA`);
    hasErrors = true;
  } else if (varName === 'DATABASE_URL') {
    // Verificar que no sea la URL por defecto de Prisma
    if (value.includes('db.prisma.io')) {
      console.error(`❌ ${varName}: Usando URL por defecto (db.prisma.io) - INCORRECTO`);
      hasErrors = true;
    } else {
      const masked = value.replace(/:[^:@]+@/, ':***@');
      console.log(`✅ ${varName}: ${masked}`);
    }
  } else if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
    console.log(`✅ ${varName}: ****** (${value.length} caracteres)`);
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

console.log('');

if (hasErrors) {
  console.error('❌ Error: Faltan variables de entorno críticas.');
  console.error('Por favor configura las variables en Vercel Dashboard:');
  console.error('Settings → Environment Variables\n');
  process.exit(1);
}

console.log('✅ Todas las variables de entorno están configuradas correctamente.\n');
