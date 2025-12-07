/**
 * Sistema de mapeo de iconos de rangos
 * 
 * Este archivo mapea los identificadores de iconos almacenados en la base de datos
 * a componentes React de lucide-react para una renderización consistente y escalable.
 * 
 * Uso:
 * - RankIcon: Componente para renderizar iconos de rangos
 * - RANK_ICON_MAP: Mapeo de identificadores a componentes de lucide-react
 */

import { createElement } from 'react';
import {
  Crown,
  Star,
  Laptop,
  Zap,
  Eye,
  Shield,
  Scroll,
  Sword,
  Sunrise,
  Book,
  ShieldCheck,
  GraduationCap,
  User,
  HelpCircle,
  type LucideIcon
} from 'lucide-react';

// Tipo para el mapeo de iconos
export type RankIconMap = {
  [key: string]: LucideIcon;
};

/**
 * Mapeo de identificadores de iconos a componentes de lucide-react
 * Todos los iconos utilizan componentes React nativos para mejor rendimiento y escalabilidad
 */
export const RANK_ICON_MAP: RankIconMap = {
  // Rangos de Cúpula Directiva (1-3)
  'crown': Crown,           // Corona - Cúpula Directiva
  'star': Star,             // Estrella - Cúpula Estratégica
  'laptop': Laptop,         // Laptop - Cúpula Operativa
  
  // Rangos de Soberanos/Súbditos (4-13)
  'zap': Zap,               // Rayo - Estratega Supremo
  'eye': Eye,               // Ojo - Vigía Mayor
  'shield': Shield,         // Escudo - Guardián de Sombras
  'scroll': Scroll,         // Pergamino - Escriba Maestro
  'sword': Sword,           // Espadas - Guerrero de Élite
  'sunrise': Sunrise,       // Amanecer - Sombra del Alba
  'book': Book,             // Libro - Aprendiz Mayor
  'shield-check': ShieldCheck, // Escudo verificado - Sombra Activa
  'graduation-cap': GraduationCap, // Gorra de graduación - Sombra en Formación
  'user': User,             // Usuario - Sombra Aprendiz
  
  // Fallback para iconos no mapeados
  'default': HelpCircle
};

/**
 * Obtiene el componente de icono para un identificador de rango
 * @param iconIdentifier - El identificador del icono desde la base de datos
 * @returns El componente de icono de lucide-react
 */
export function getRankIconComponent(iconIdentifier: string): LucideIcon {
  return RANK_ICON_MAP[iconIdentifier] || RANK_ICON_MAP['default'];
}

/**
 * Renderiza un icono de rango con estilos consistentes
 * @param iconIdentifier - El identificador del icono desde la base de datos
 * @param className - Clases CSS opcionales
 * @param style - Estilos inline opcionales
 * @param size - Tamaño del icono (por defecto: 20)
 * @returns JSX con el icono renderizado
 */
export function RankIcon({ 
  iconIdentifier, 
  className = '', 
  style = {},
  size = 20
}: { 
  iconIdentifier: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}) {
  const IconComponent = getRankIconComponent(iconIdentifier);
  
  return createElement(IconComponent, {
    className,
    style,
    size
  });
}
