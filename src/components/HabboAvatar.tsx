'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Loader2, UserX } from 'lucide-react'

interface HabboAvatarProps {
  src: string
  alt: string
  size?: number
  className?: string
}

export default function HabboAvatar({ src, alt, size = 64, className = '' }: HabboAvatarProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Proporción de avatares de Habbo: ancho:alto = 1:1.7
  const height = Math.round(size * 1.7)

  return (
    <div className={`relative ${className}`} style={{ width: size, height: height }}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg border border-[#CC933B]/20">
          <Loader2 className="w-6 h-6 text-[#CC933B] animate-spin" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg border border-[#CC933B]/20">
          <UserX className="w-6 h-6 text-[#CC933B]/50" />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={height}
          className={`rounded-lg border border-[#CC933B]/30 transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        />
      )}
    </div>
  )
}
