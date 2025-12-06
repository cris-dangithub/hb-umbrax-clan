'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'

function ModalManagerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)

  useEffect(() => {
    const modal = searchParams.get('modal')
    setLoginOpen(modal === 'login')
    setRegisterOpen(modal === 'register')
  }, [searchParams])

  const closeModal = () => {
    router.push('/', { scroll: false })
  }

  const switchToRegister = () => {
    router.push('?modal=register', { scroll: false })
  }

  const switchToLogin = () => {
    router.push('?modal=login', { scroll: false })
  }

  return (
    <>
      <LoginModal
        isOpen={loginOpen}
        onClose={closeModal}
        onSwitchToRegister={switchToRegister}
      />
      <RegisterModal
        isOpen={registerOpen}
        onClose={closeModal}
        onSwitchToLogin={switchToLogin}
      />
    </>
  )
}

export default function ModalManager() {
  return (
    <Suspense fallback={null}>
      <ModalManagerContent />
    </Suspense>
  )
}
