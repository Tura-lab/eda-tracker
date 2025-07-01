"use client"

import { useEffect } from "react"

interface ToastProps {
  isOpen: boolean
  type: 'success' | 'error'
  title: string
  message: string
  onClose: () => void
  duration?: number // Auto-dismiss duration in milliseconds
}

export default function Toast({
  isOpen,
  type,
  title,
  message,
  onClose,
  duration = 5000
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50'
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200'
  const iconColor = type === 'success' ? 'text-green-600' : 'text-red-600'
  const titleColor = type === 'success' ? 'text-green-800' : 'text-red-800'

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className={`${bgColor} ${borderColor} border rounded-lg p-4 shadow-lg`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className={`w-6 h-6 ${iconColor}`}>
              {type === 'success' ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 