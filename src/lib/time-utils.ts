/**
 * Utilidades puras para manejo de tiempo y formateo
 * Este archivo NO importa Prisma, es seguro para uso en cliente y servidor
 */

/**
 * Parsea string de meta de misión formato "dd HH:mm" a minutos totales
 * @param goalString - String en formato "dd HH:mm" (ej: "02 15:30")
 * @returns Total de minutos o null si inválido
 */
export function parseMissionGoal(goalString: string | null): number | null {
  if (!goalString) return null;
  
  const match = goalString.match(/^(\d{2})\s(\d{2}):(\d{2})$/);
  if (!match) return null;
  
  const [, days, hours, minutes] = match;
  const totalMinutes = 
    parseInt(days) * 24 * 60 + 
    parseInt(hours) * 60 + 
    parseInt(minutes);
  
  return totalMinutes;
}

/**
 * Formatea minutos a string legible "Xd Xh Xm"
 * @param minutes - Total de minutos
 * @returns String formateado
 */
export function formatMinutesToReadable(minutes: number): string {
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  
  return parts.length > 0 ? parts.join(' ') : '0m';
}

/**
 * Formatea minutos a formato "HH:mm:ss"
 * @param minutes - Total de minutos
 * @returns String en formato HH:mm:ss
 */
export function formatMinutesToHHMMSS(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes * 60) % 60);
  
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Calcula minutos transcurridos desde una fecha hasta ahora
 * @param startDate - Fecha de inicio
 * @returns Minutos transcurridos
 */
export function calculateElapsedMinutes(startDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Calcula porcentaje de progreso hacia meta
 * @param currentMinutes - Minutos actuales
 * @param goalMinutes - Minutos de la meta
 * @returns Porcentaje (0-100), o null si no hay meta
 */
export function calculateProgressPercentage(
  currentMinutes: number, 
  goalMinutes: number | null
): number | null {
  if (!goalMinutes || goalMinutes === 0) return null;
  return Math.min(100, Math.round((currentMinutes / goalMinutes) * 100));
}
