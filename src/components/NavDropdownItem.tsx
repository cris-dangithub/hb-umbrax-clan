'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface NavDropdownItemProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
  onClick?: () => void
}

export default function NavDropdownItem({
  href,
  icon: Icon,
  children,
  onClick,
}: NavDropdownItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: isActive
          ? 'rgba(204, 147, 59, 0.2)'
          : 'rgba(15, 15, 15, 0.5)',
        borderLeft: isActive ? '3px solid #CC933B' : '3px solid transparent',
      }}
    >
      <Icon className="w-5 h-5" style={{ color: '#CC933B' }} />
      <span
        className="text-sm font-medium"
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          color: isActive ? '#CC933B' : '#FFFFFF',
        }}
      >
        {children}
      </span>
    </Link>
  )
}
