/**
 * Sistema de mapeo de iconos de rangos
 * 
 * Este archivo mapea los identificadores de iconos almacenados en la base de datos
 * a iconos visuales que pueden ser texto Unicode o componentes React.
 * 
 * Uso:
 * - getRankIcon(iconIdentifier): Retorna el icono renderizable (string o ReactNode)
 * - isReactComponent(icon): Verifica si el resultado es un componente React
 */

import { ReactNode } from 'react'

// Tipo para el mapeo de iconos
export type RankIconMap = {
  [key: string]: string | ReactNode
}

/**
 * Mapeo de identificadores de iconos a representaciones visuales
 * Por defecto usa iconos de texto Unicode
 * En el futuro se puede reemplazar con componentes React importando desde lucide-react
 */
export const RANK_ICON_MAP: RankIconMap = {
  // Rangos de Cúpula Directiva (1-3)
  'crown': '👑',        // Corona - Cúpula Directiva
  'star': '⭐',         // Estrella - Cúpula Estratégica
  'laptop': '💻',       // Laptop - Cúpula Operativa
  
  // Rangos de Soberanos/Súbditos (4-13)
  'zap': '⚡',          // Rayo - Estratega Supremo
  'eye': '👁️',          // Ojo - Vigía Mayor
  'shield': '🛡️',       // Escudo - Guardián de Sombras
  'scroll': '📜',       // Pergamino - Escriba Maestro
  'sword': '⚔️',        // Espadas - Guerrero de Élite
  'sunrise': '🌅',      // Amanecer - Sombra del Alba
  'book': '📖',         // Libro - Aprendiz Mayor
  'shield-check': '✅', // Escudo verificado - Sombra Activa
  'graduation-cap': '🎓', // Gorra de graduación - Sombra en Formación
  'user': '👤',         // Usuario - Sombra Aprendiz
  
  // Fallback para iconos no mapeados
  'default': '❓'
}

/**
 * Obtiene el icono renderizable para un identificador de rango
 * @param iconIdentifier - El identificador del icono desde la base de datos
 * @returns El icono como string (emoji) o ReactNode (componente)
 */
export function getRankIcon(iconIdentifier: string): string | ReactNode {
  return RANK_ICON_MAP[iconIdentifier] || RANK_ICON_MAP['default']
}

/**
 * Verifica si un icono es un componente React
 * @param icon - El icono a verificar
 * @returns true si es un ReactNode que no es string
 */
export function isReactComponent(icon: string | ReactNode): icon is ReactNode {
  return typeof icon !== 'string'
}

/**
 * Renderiza un icono de rango con estilos consistentes
 * @param iconIdentifier - El identificador del icono desde la base de datos
 * @param className - Clases CSS opcionales
 * @param style - Estilos inline opcionales
 * @returns JSX con el icono renderizado
 */
export function RankIcon({ 
  iconIdentifier, 
  className = '', 
  style = {} 
}: { 
  iconIdentifier: string
  className?: string
  style?: React.CSSProperties 
}) {
  const icon = getRankIcon(iconIdentifier)
  
  // Si es un componente React, lo renderizamos directamente
  if (isReactComponent(icon)) {
    return <span className={className} style={style}>{icon}</span>
  }
  
  // Si es un string (emoji), lo renderizamos como texto
  return (
    <span 
      className={className} 
      style={{ 
        fontSize: '1.2rem',
        display: 'inline-block',
        ...style 
      }}
    >
      {icon}
    </span>
  )
}
