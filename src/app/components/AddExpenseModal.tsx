"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Toast from "./Toast"

interface User {
  id: string
  name: string
  email: string
}

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Local storage key for common users
const COMMON_USERS_KEY = "splitwise_common_users"

// Helper function to get first name from full name
const getFirstName = (fullName: string): string => {
  return fullName.split(' ')[0] || fullName
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const { data: session } = useSession()
  const [amount, setAmount] = useState("")
  const [type] = useState<"lend" | "borrow">("lend") // Always lending since borrowers don't add transactions
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [description, setDescription] = useState("")
  const [receiptUrl, setReceiptUrl] = useState("")
  const [isPayment, setIsPayment] = useState(false)
  const [isSplit, setIsSplit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [commonUsers, setCommonUsers] = useState<User[]>([])
  const [toast, setToast] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'error',
    title: "",
    message: ""
  })

  // Load common users from localStorage on component mount
  useEffect(() => {
    if (isOpen) {
      loadCommonUsers()
    }
  }, [isOpen])

  // Load common users from localStorage
  const loadCommonUsers = () => {
    try {
      const stored = localStorage.getItem(COMMON_USERS_KEY)
      if (stored) {
        const users = JSON.parse(stored)
        setCommonUsers(users)
      }
    } catch (error) {
      console.error("Error loading common users:", error)
    }
  }

  // Save common users to localStorage
  const saveCommonUsers = (users: User[]) => {
    try {
      localStorage.setItem(COMMON_USERS_KEY, JSON.stringify(users))
    } catch (error) {
      console.error("Error saving common users:", error)
    }
  }

  // Add user to common users list
  const addToCommonUsers = (user: User) => {
    setCommonUsers(prev => {
      // Check if user already exists
      const exists = prev.some(u => u.id === user.id)
      if (!exists) {
        const newList = [user, ...prev].slice(0, 10) // Keep only top 10 most recent
        saveCommonUsers(newList)
        return newList
      }
      return prev
    })
  }

  // Search for users
  useEffect(() => {
    if (searchQuery.length > 1) {
      const timeoutId = setTimeout(async () => {
        setIsSearching(true)
        try {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
          if (response.ok) {
            const users = await response.json()
            // Filter out already selected users
            const availableUsers = users.filter((user: User) => 
              !selectedUsers.some(selected => selected.id === user.id)
            )
            setSearchResults(availableUsers)
          }
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setIsSearching(false)
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, selectedUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Person selection is disabled, so show appropriate message
    setToast({
      isOpen: true,
      type: 'error',
      title: "Feature Disabled",
      message: "Person selection is currently disabled. Please try again later."
    })
  }

  const addUser = (user: User) => {
    // Check if user is already selected to prevent duplicate selection
    const isAlreadySelected = selectedUsers.some(selectedUser => selectedUser.id === user.id)
    if (!isAlreadySelected) {
      setSelectedUsers(prev => [...prev, user])
      setSearchQuery("")
      setSearchResults([])
    }
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId))
  }

  const selectCommonUser = (user: User) => {
    // Check if user is already selected to prevent duplicate selection
    const isAlreadySelected = selectedUsers.some(selectedUser => selectedUser.id === user.id)
    if (!isAlreadySelected) {
      addUser(user)
    }
  }

  const removeCommonUser = (userId: string) => {
    setCommonUsers(prev => {
      const newList = prev.filter(user => user.id !== userId)
      saveCommonUsers(newList)
      return newList
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Add Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl sm:text-2xl cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (ETB)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="0.00"
              required
            />
          </div>

          {/* Person Selection - Disabled */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Who did you lend/pay money to?
            </label>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">Person selection is currently disabled</p>
                <p className="text-xs mt-1">This feature is temporarily unavailable</p>
              </div>
            </div>
          </div>

          {/* Selected Users - Hidden since person selection is disabled */}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="e.g., Dinner, Gas money, Concert tickets..."
              required
            />
          </div>

          {/* Receipt URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Receipt URL (optional)
            </label>
            <input
              type="text"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="https://example.com/receipt.pdf or any text reference..."
            />
          </div>

          {/* Payment Checkbox */}
          <div>
            <label className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <input
                type="checkbox"
                checked={isPayment}
                onChange={(e) => setIsPayment(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  This is a payment
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Check this if you&apos;re paying back money you owe
                </p>
              </div>
            </label>
          </div>

          {/* Split Checkbox - Hidden since person selection is disabled */}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={true}
              className="flex-1 px-4 py-2 bg-gray-400 dark:bg-gray-600 
                         text-white rounded-md cursor-not-allowed transition-colors"
            >
              Person selection is disabled
            </button>
          </div>
        </form>
      </div>
      
      {/* Toast */}
      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({isOpen: false, type: 'error', title: "", message: ""})}
      />
    </div>
  )
} 