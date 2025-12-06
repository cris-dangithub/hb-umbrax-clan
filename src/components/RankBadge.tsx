interface RankBadgeProps {
  rankName: string
  rankOrder: number
  size?: 'small' | 'medium' | 'large'
}

export default function RankBadge({ rankName, rankOrder, size = 'medium' }: RankBadgeProps) {
  // Determinar color basado en jerarquía
  // Rangos 1-3: Oro brillante (alta jerarquía)
  // Rangos 4-7: Oro opaco (jerarquía media)
  // Rangos 8-10: Rojo sangre (baja jerarquía)
  const getColorStyle = () => {
    if (rankOrder <= 3) {
      return {
        backgroundColor: '#CC933B',
        color: '#0f0f0f',
        borderColor: '#CC933B',
        boxShadow: '0 0 15px rgba(204, 147, 59, 0.6)',
      }
    } else if (rankOrder <= 7) {
      return {
        backgroundColor: 'rgba(204, 147, 59, 0.2)',
        color: '#CC933B',
        borderColor: '#CC933B',
        boxShadow: '0 0 10px rgba(204, 147, 59, 0.3)',
      }
    } else {
      return {
        backgroundColor: 'rgba(74, 12, 17, 0.4)',
        color: '#CC933B',
        borderColor: '#4A0C11',
        boxShadow: '0 0 8px rgba(74, 12, 17, 0.5)',
      }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-xs'
      case 'large':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-sm'
    }
  }

  const colorStyle = getColorStyle()
  const sizeClasses = getSizeClasses()

  return (
    <div
      className={`inline-flex items-center gap-2 rounded font-bold ${sizeClasses}`}
      style={{
        ...colorStyle,
        fontFamily: 'Rajdhani, sans-serif',
        border: '2px solid',
        borderColor: colorStyle.borderColor,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Indicador de orden */}
      <span
        className="font-mono font-bold"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          fontSize: size === 'small' ? '8px' : size === 'large' ? '12px' : '10px',
        }}
      >
        #{rankOrder}
      </span>

      {/* Nombre del rango */}
      <span>{rankName}</span>
    </div>
  )
}
