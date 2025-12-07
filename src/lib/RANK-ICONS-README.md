# Sistema de Iconos de Rangos

## Descripción

Sistema centralizado para mapear identificadores de iconos de rangos almacenados en la base de datos a representaciones visuales (emojis o componentes React).

## Archivos

### `src/lib/rank-icons.tsx`
Archivo principal que contiene:
- `RANK_ICON_MAP`: Mapeo de identificadores a iconos
- `getRankIcon()`: Función para obtener un icono
- `RankIcon`: Componente React para renderizar iconos

### `src/lib/rank-icons.example.tsx`
Archivo de ejemplo mostrando cómo migrar de emojis a componentes React de lucide-react.

## Uso Actual

### En componentes

```tsx
import { RankIcon } from '@/lib/rank-icons'

// Renderizar icono con tamaño predeterminado
<RankIcon iconIdentifier={user.rank.icon} />

// Renderizar icono con estilos personalizados
<RankIcon 
  iconIdentifier={user.rank.icon} 
  style={{ fontSize: '1.5rem' }}
/>
```

### Programáticamente

```tsx
import { getRankIcon } from '@/lib/rank-icons'

const icon = getRankIcon('crown') // Retorna '👑'
```

## Mapeo Actual (Emojis)

| Identificador | Emoji | Rango |
|--------------|-------|-------|
| `crown` | 👑 | Cúpula Directiva |
| `star` | ⭐ | Cúpula Estratégica |
| `laptop` | 💻 | Cúpula Operativa |
| `zap` | ⚡ | Estratega Supremo |
| `eye` | 👁️ | Vigía Mayor |
| `shield` | 🛡️ | Guardián de Sombras |
| `scroll` | 📜 | Escriba Maestro |
| `sword` | ⚔️ | Guerrero de Élite |
| `sunrise` | 🌅 | Sombra del Alba |
| `book` | 📖 | Aprendiz Mayor |
| `shield-check` | ✅ | Sombra Activa |
| `graduation-cap` | 🎓 | Sombra en Formación |
| `user` | 👤 | Sombra Aprendiz |

## Migración a Componentes React

Para migrar de emojis a componentes React de lucide-react:

### 1. Editar `src/lib/rank-icons.tsx`

```tsx
// 1. Importar iconos de lucide-react
import {
  Crown,
  Star,
  Laptop,
  Zap,
  Eye,
  Shield,
  ScrollText,
  Swords,
  Sunrise,
  Book,
  ShieldCheck,
  GraduationCap,
  User
} from 'lucide-react'

// 2. Actualizar RANK_ICON_MAP
export const RANK_ICON_MAP: RankIconMap = {
  'crown': <Crown className="w-5 h-5" style={{ color: '#FFD700' }} />,
  'star': <Star className="w-5 h-5" style={{ color: '#FFD700' }} />,
  'laptop': <Laptop className="w-5 h-5" style={{ color: '#FFD700' }} />,
  'zap': <Zap className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'eye': <Eye className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'shield': <Shield className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'scroll': <ScrollText className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'sword': <Swords className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'sunrise': <Sunrise className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'book': <Book className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'shield-check': <ShieldCheck className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'graduation-cap': <GraduationCap className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'user': <User className="w-5 h-5" style={{ color: '#CC933B' }} />,
  'default': <span style={{ color: '#666' }}>?</span>
}
```

### 2. No requiere cambios en componentes

El componente `RankIcon` automáticamente detecta si el icono es un componente React o un string y lo renderiza correctamente.

### 3. Referencia completa

Consulta `src/lib/rank-icons.example.tsx` para ver un ejemplo completo con opciones avanzadas.

## Componentes Actualizados

Los siguientes componentes ya usan el sistema de iconos:
- ✅ `UserTable.tsx` - Tabla de usuarios
- ✅ `SendTimeRequestModal.tsx` - Modal de solicitud de time
- ✅ `ChangeRankModal.tsx` - Modal de cambio de rango

## Agregar Nuevos Iconos

1. Agregar entrada en `RANK_ICON_MAP`:
```tsx
export const RANK_ICON_MAP: RankIconMap = {
  // ...iconos existentes
  'nuevo-icono': '🆕', // o <NuevoIcono className="w-5 h-5" />
}
```

2. Actualizar la base de datos (si es necesario):
```sql
UPDATE "Rank" SET icon = 'nuevo-icono' WHERE id = X;
```

## Arquitectura

```
Database (icon: string)
    ↓
rank-icons.tsx (RANK_ICON_MAP)
    ↓
RankIcon Component
    ↓
Rendered UI (emoji o React component)
```

## Beneficios

- ✅ Centralización: Un solo lugar para definir iconos
- ✅ Flexibilidad: Soporta strings y React components
- ✅ Escalabilidad: Fácil agregar nuevos iconos
- ✅ Consistencia: Mismo estilo en toda la app
- ✅ Type-safe: TypeScript para prevenir errores
- ✅ Future-proof: Preparado para migrar a componentes React
