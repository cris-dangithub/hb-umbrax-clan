'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from './Navbar'
import ModalManager from './ModalManager'
import { ToastProvider } from './ToastProvider'
import { WebSocketProvider } from '@/contexts/WebSocketContext'
import type { UserWithRank } from '@/lib/get-current-user'

interface ClientLayoutProps {
  user?: UserWithRank | null
  wsToken?: string | null
  children: React.ReactNode
}

export default function ClientLayout({ user, wsToken, children }: ClientLayoutProps) {
  const router = useRouter()

  const openLogin = () => {
    router.push('?modal=login', { scroll: false })
  }

  const openRegister = () => {
    router.push('?modal=register', { scroll: false })
  }

  return (
    <WebSocketProvider wsToken={wsToken || null}>
      <ToastProvider>
        <Navbar user={user} onOpenLogin={openLogin} onOpenRegister={openRegister} />
        {children}
        <ModalManager />
      </ToastProvider>
    </WebSocketProvider>
  )
}
