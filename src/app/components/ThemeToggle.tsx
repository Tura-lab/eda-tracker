"use client"

import { useTheme } from './ThemeProvider'
import { useState, useRef, useEffect } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themes = [
    { key: 'light', label: 'Light', icon: '☀️' },
    { key: 'dark', label: 'Dark', icon: '🌙' },
    { key: 'system', label: 'System', icon: '💻' }
  ] as const

  const currentTheme = themes.find(t => t.key === theme) || themes[2]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium 
                   bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 
                   text-gray-700 dark:text-gray-300 transition-colors"
        aria-label="Theme selector"
      >
        <span className="text-lg">{currentTheme.icon}</span>
        <span className="hidden sm:inline">{currentTheme.label}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg 
                        bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 
                        dark:ring-gray-700 z-50">
          <div className="py-1">
            {themes.map((themeOption) => (
              <button
                key={themeOption.key}
                onClick={() => {
                  setTheme(themeOption.key)
                  setIsOpen(false)
                }}
                className={`flex items-center space-x-2 w-full px-4 py-2 text-sm text-left
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                           ${theme === themeOption.key 
                             ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                             : 'text-gray-700 dark:text-gray-300'
                           }`}
              >
                <span className="text-lg">{themeOption.icon}</span>
                <span>{themeOption.label}</span>
                {theme === themeOption.key && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 