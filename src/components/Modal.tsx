'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 z-50 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      />

      {/* Modal Container - Centered with proper constraints */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full flex items-center justify-center p-4 sm:p-6">
          {/* Modal Content */}
          <div
            className="relative w-full overflow-hidden max-w-sm sm:max-w-md mx-auto pointer-events-auto backdrop-blur-md rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col"
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.95)',
              border: '2px solid #CC933B',
              maxHeight: 'min(90vh, 800px)',
              minHeight: 'min(300px, 50vh)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Close Button */}
            {title && (
              <div
                className="relative px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0 flex items-center justify-between"
                style={{
                  borderColor: '#CC933B',
                  backgroundColor: 'rgba(74, 12, 17, 0.95)',
                }}
              >
                <h2
                  className="text-base sm:text-lg font-bold pr-2"
                  style={{
                    fontFamily: '"Press Start 2P", cursive',
                    color: '#CC933B',
                    textShadow: '0 0 10px rgba(204, 147, 59, 0.5)',
                    fontSize: 'clamp(10px, 2vw, 14px)',
                  }}
                >
                  {title}
                </h2>

                {/* Close Button - Inside Header, Centered Vertically */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110"
                  style={{
                    backgroundColor: 'rgba(74, 12, 17, 0.5)',
                    border: '1px solid #CC933B',
                  }}
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#CC933B' }} />
                </button>
              </div>
            )}

            {/* Modal Body - Flexible with scroll */}
            <div className="flex-1 overflow-y-auto modal-scrollbar p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
