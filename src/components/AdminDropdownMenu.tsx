'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Shield,
  ChevronDown,
  Users,
  TrendingUp,
  Crown,
  Settings,
  BarChart,
  FileText,
  ClipboardList,
  FileCheck,
  BarChart2,
} from 'lucide-react'
import NavDropdownItem from './NavDropdownItem'
import type { UserWithRank } from '@/lib/get-current-user'

interface AdminDropdownMenuProps {
  user: UserWithRank
}

export default function AdminDropdownMenu({ user }: AdminDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const hasFullAccess = user.rank.order <= 3
  const isSovereign = user.isSovereign

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on navigation
  const handleNavigation = () => {
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded transition-all hover:scale-105 h-full"
        style={{
          backgroundColor: 'rgba(204, 147, 59, 0.2)',
          border: '1px solid #CC933B',
        }}
      >
        <Shield className="w-5 h-5" style={{ color: '#CC933B' }} />
        <span
          className="text-sm font-semibold hidden sm:inline"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}
        >
          Panel Admin
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: '#CC933B' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-64 rounded-lg shadow-2xl overflow-hidden z-50"
          style={{
            backgroundColor: 'rgba(15, 15, 15, 0.95)',
            border: '2px solid #CC933B',
          }}
        >
          {/* Cúpula Directiva - Menú Completo */}
          {hasFullAccess && (
            <>
              <NavDropdownItem
                href="/admin/users"
                icon={Users}
                onClick={handleNavigation}
              >
                Gestión de Usuarios
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/promotions"
                icon={TrendingUp}
                onClick={handleNavigation}
              >
                Solicitudes de Ascenso
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/rank-bosses"
                icon={Crown}
                onClick={handleNavigation}
              >
                Soberanos
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/settings"
                icon={Settings}
                onClick={handleNavigation}
              >
                Configuración
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/stats"
                icon={BarChart}
                onClick={handleNavigation}
              >
                Estadísticas
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/audit"
                icon={FileText}
                onClick={handleNavigation}
              >
                Logs de Auditoría
              </NavDropdownItem>
            </>
          )}

          {/* Soberanos - Menú Limitado */}
          {isSovereign && user.rank.order > 3 && (
            <>
              <NavDropdownItem
                href="/admin/users"
                icon={Users}
                onClick={handleNavigation}
              >
                Gestión de Usuarios
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/my-requests"
                icon={ClipboardList}
                onClick={handleNavigation}
              >
                Mis Solicitudes
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/subordinates"
                icon={Users}
                onClick={handleNavigation}
              >
                Súbditos del Clan
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/approve"
                icon={FileCheck}
                onClick={handleNavigation}
              >
                Aprobar Ascensos
              </NavDropdownItem>
              <NavDropdownItem
                href="/admin/my-stats"
                icon={BarChart2}
                onClick={handleNavigation}
              >
                Mis Estadísticas
              </NavDropdownItem>
            </>
          )}
        </div>
      )}
    </div>
  )
}
