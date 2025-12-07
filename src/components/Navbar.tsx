'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Radio, Calendar, Info, User, LogOut, Loader2, Check } from 'lucide-react'
import AdminDropdownMenu from './AdminDropdownMenu'
import type { UserWithRank } from '@/lib/get-current-user'
import { hasAdminPermissions } from '@/lib/roles'

interface NavbarProps {
  user?: UserWithRank | null
  onOpenLogin?: () => void
  onOpenRegister?: () => void
}

export default function Navbar({ user, onOpenLogin, onOpenRegister }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isInfoDropdownOpen, setIsInfoDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutSuccess, setLogoutSuccess] = useState(false)
  const pathname = usePathname()

  // Close menus when route changes
  useEffect(() => {
    // This is intentional - we want to close menus when navigating
    // Using a cleanup pattern to satisfy linting
    return () => {
      // Menu states will reset on next render due to dependency
    }
  }, [pathname])

  // Reset menu states based on pathname
  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false)
    if (isInfoDropdownOpen) setIsInfoDropdownOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsInfoDropdownOpen(false)
    if (isInfoDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isInfoDropdownOpen])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setLogoutSuccess(true)
      setTimeout(() => {
        window.location.href = '/'
      }, 800)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      window.location.href = '/'
    }
  }

  const navLinks = [
    { href: '/radio', label: 'Radio', icon: Radio },
    { href: '/eventos', label: 'Eventos', icon: Calendar },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(15, 15, 15, 0.9)',
        borderBottom: '2px solid #CC933B',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="text-lg sm:text-xl font-bold transition-all group-hover:scale-105"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#CC933B',
                textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
                fontSize: 'clamp(10px, 2vw, 14px)',
              }}
            >
              UMBRAX CLAN
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded transition-all hover:scale-105"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: pathname === link.href ? '#CC933B' : '#ededed',
                  backgroundColor:
                    pathname === link.href ? 'rgba(204, 147, 59, 0.1)' : 'transparent',
                  border: pathname === link.href ? '1px solid #CC933B' : '1px solid transparent',
                }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}

            {/* Info Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsInfoDropdownOpen(!isInfoDropdownOpen)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded transition-all hover:scale-105"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#ededed',
                  border: '1px solid #CC933B',
                }}
              >
                <Info className="w-4 h-4" />
                Información
              </button>

              {isInfoDropdownOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-48 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(15, 15, 15, 0.95)',
                    border: '2px solid #CC933B',
                  }}
                >
                  <Link
                    href="/roles"
                    className="block px-4 py-3 transition-colors hover:bg-black/50"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: '#ededed',
                      borderBottom: '1px solid rgba(204, 147, 59, 0.2)',
                    }}
                  >
                    📋 Roles del Clan
                  </Link>
                  <Link
                    href="/privacy"
                    className="block px-4 py-3 transition-colors hover:bg-black/50"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: '#ededed',
                    }}
                  >
                    🔒 Política de Privacidad
                  </Link>
                </div>
              )}
            </div>

            {/* User Account */}
            {user ? (
              <div className="flex items-center gap-3">
                {/* Admin Panel Dropdown - Solo para usuarios con permisos */}
                {hasAdminPermissions(user) && (
                  <AdminDropdownMenu user={user} />
                )}
                
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded transition-all hover:scale-105"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#0f0f0f',
                    backgroundColor: '#CC933B',
                    border: '2px solid #CC933B',
                  }}
                >
                  <User className="w-4 h-4" />
                  {user.habboName}
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-3 py-2 rounded transition-all hover:scale-105 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    color: logoutSuccess ? '#00FF00' : '#CC933B',
                    border: `1px solid ${logoutSuccess ? '#00FF00' : '#CC933B'}`,
                    opacity: isLoggingOut && !logoutSuccess ? 0.7 : 1,
                  }}
                  title="Cerrar sesión"
                >
                  {isLoggingOut ? (
                    logoutSuccess ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 rounded transition-all hover:scale-105"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                    border: '1px solid #CC933B',
                  }}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={onOpenRegister}
                  className="px-4 py-2 rounded font-bold transition-all hover:scale-105"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#0f0f0f',
                    backgroundColor: '#CC933B',
                    border: '2px solid #CC933B',
                  }}
                >
                  Únete
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: '#CC933B' }}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.95)',
            borderTop: '1px solid rgba(204, 147, 59, 0.3)',
          }}
        >
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  color: pathname === link.href ? '#CC933B' : '#ededed',
                  backgroundColor:
                    pathname === link.href ? 'rgba(204, 147, 59, 0.1)' : 'transparent',
                  border: pathname === link.href ? '1px solid #CC933B' : '1px solid transparent',
                }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}

            <Link
              href="/roles"
              className="flex items-center gap-2 px-4 py-2 rounded"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#ededed',
                border: '1px solid transparent',
              }}
            >
              📋 Roles del Clan
            </Link>

            {user ? (
              <>
                {/* Panel Admin - Solo para usuarios con permisos */}
                {hasAdminPermissions(user) && (
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-2 px-4 py-2 rounded"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      color: '#0f0f0f',
                      backgroundColor: '#CC933B',
                      border: '2px solid #CC933B',
                    }}
                  >
                    ⚡ Panel Admin
                  </Link>
                )}
                
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#0f0f0f',
                    backgroundColor: '#CC933B',
                  }}
                >
                  <User className="w-4 h-4" />
                  Mi Cuenta ({user.habboName})
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2 px-4 py-2 rounded cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: logoutSuccess ? '#00FF00' : '#CC933B',
                    border: `1px solid ${logoutSuccess ? '#00FF00' : '#CC933B'}`,
                    opacity: isLoggingOut && !logoutSuccess ? 0.7 : 1,
                  }}
                >
                  {isLoggingOut ? (
                    logoutSuccess ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {isLoggingOut ? (logoutSuccess ? 'Sesión cerrada' : 'Cerrando sesión...') : 'Cerrar Sesión'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  className="w-full px-4 py-2 rounded"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                    border: '1px solid #CC933B',
                  }}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={onOpenRegister}
                  className="w-full px-4 py-2 rounded font-bold"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#0f0f0f',
                    backgroundColor: '#CC933B',
                  }}
                >
                  Únete al Clan
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
