'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, handleClose])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />
      case 'error':
        return <XCircle size={20} />
      case 'warning':
        return <AlertCircle size={20} />
      case 'info':
        return <Info size={20} />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(34, 197, 94, 0.9)',
          border: '#22c55e',
        }
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.9)',
          border: '#ef4444',
        }
      case 'warning':
        return {
          bg: 'rgba(234, 179, 8, 0.9)',
          border: '#eab308',
        }
      case 'info':
        return {
          bg: 'rgba(59, 130, 246, 0.9)',
          border: '#3b82f6',
        }
    }
  }

  const colors = getColors()

  return (
    <div
      className={`fixed top-4 right-4 z-50 backdrop-blur-md rounded-lg shadow-2xl p-4 min-w-[300px] max-w-[500px] transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div style={{ color: 'white' }}>{getIcon()}</div>
        <p className="flex-1 text-white text-sm">{message}</p>
        <button
          onClick={handleClose}
          className="text-white hover:opacity-70 transition-opacity"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
