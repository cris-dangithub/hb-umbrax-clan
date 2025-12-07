/**
 * EJEMPLO DE MIGRACIÓN A COMPONENTES REACT
 * 
 * Este archivo muestra cómo reemplazar los emojis actuales por componentes
 * React de lucide-react en el futuro.
 * 
 * INSTRUCCIONES PARA MIGRAR:
 * 
 * 1. Descomentar los imports de lucide-react
 * 2. Reemplazar las líneas comentadas en RANK_ICON_MAP
 * 3. Los componentes React se renderizarán automáticamente por RankIcon
 * 
 * El componente RankIcon en rank-icons.tsx ya está preparado para manejar
 * tanto strings (emojis) como ReactNodes (componentes React).
 */

import { ReactNode } from 'react'
// Descomentar cuando quieras usar componentes React:
// import {
//   Crown,
//   Star,
//   Laptop,
//   Zap,
//   Eye,
//   Shield,
//   ScrollText,
//   Swords,
//   Sunrise,
//   Book,
//   ShieldCheck,
//   GraduationCap,
//   User
// } from 'lucide-react'

export type RankIconMap = {
  [key: string]: string | ReactNode
}

/**
 * VERSIÓN CON COMPONENTES REACT (COMENTADA)
 * 
 * Para activar, descomentar este bloque y comentar el RANK_ICON_MAP actual
 * en rank-icons.tsx
 */

// export const RANK_ICON_MAP: RankIconMap = {
//   // Rangos de Cúpula Directiva (1-3)
//   'crown': <Crown className="w-5 h-5" style={{ color: '#FFD700' }} />,
//   'star': <Star className="w-5 h-5" style={{ color: '#FFD700' }} />,
//   'laptop': <Laptop className="w-5 h-5" style={{ color: '#FFD700' }} />,
//   
//   // Rangos de Soberanos/Súbditos (4-13)
//   'zap': <Zap className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'eye': <Eye className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'shield': <Shield className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'scroll': <ScrollText className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'sword': <Swords className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'sunrise': <Sunrise className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'book': <Book className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'shield-check': <ShieldCheck className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'graduation-cap': <GraduationCap className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   'user': <User className="w-5 h-5" style={{ color: '#CC933B' }} />,
//   
//   // Fallback
//   'default': <span style={{ color: '#666' }}>?</span>
// }

/**
 * ALTERNATIVA: Función generadora de iconos
 * 
 * Esta función permite generar iconos con diferentes tamaños y colores
 */

// export function createRankIcon(
//   IconComponent: any,
//   color: string = '#CC933B',
//   size: number = 20
// ): ReactNode {
//   return <IconComponent className={`w-${size} h-${size}`} style={{ color }} />
// }

// export const RANK_ICON_MAP_DYNAMIC: RankIconMap = {
//   'crown': createRankIcon(Crown, '#FFD700'),
//   'star': createRankIcon(Star, '#FFD700'),
//   // ... etc
// }
