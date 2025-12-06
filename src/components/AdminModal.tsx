'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  headerBgColor?: string // Color de fondo del header
  borderColor?: string   // Color del borde
}

export default function AdminModal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  headerBgColor = 'rgba(30, 58, 138, 0.95)', // Azul por defecto
  borderColor = '#3B82F6' // Azul claro por defecto
}: AdminModalProps) {
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

  const modalContent = (
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
            className="relative w-full overflow-hidden max-w-sm sm:max-w-2xl mx-auto pointer-events-auto backdrop-blur-md rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col"
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.95)',
              border: `2px solid ${borderColor}`,
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
                  borderColor: borderColor,
                  backgroundColor: headerBgColor,
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
                    backgroundColor: 'rgba(15, 15, 15, 0.5)',
                    border: `1px solid ${borderColor}`,
                  }}
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: borderColor }} />
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

  // Render modal in a portal attached to document.body to escape any parent positioning contexts
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
