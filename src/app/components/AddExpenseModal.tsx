"use client"

import { useState, useEffect } from "react"
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

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const [amount, setAmount] = useState("")
  const [type] = useState<"lend" | "borrow">("lend") // Always lending since borrowers don't add transactions
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [toast, setToast] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'error',
    title: "",
    message: ""
  })

  // Search for users
  useEffect(() => {
    if (searchQuery.length > 1 && !selectedUser) {
      const timeoutId = setTimeout(async () => {
        setIsSearching(true)
        try {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
          if (response.ok) {
            const users = await response.json()
            setSearchResults(users)
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
  }, [searchQuery, selectedUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser || !amount || !description) {
      setToast({
        isOpen: true,
        type: 'error',
        title: "Missing Information",
        message: "Please fill in all fields"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          otherUserId: selectedUser.id,
          description,
        }),
      })

      if (response.ok) {
        // Reset form
        setAmount("")
        setSearchQuery("")
        setSelectedUser(null)
        setDescription("")
        setToast({
          isOpen: true,
          type: 'success',
          title: "Success!",
          message: "Transaction added successfully."
        })
        onSuccess()
        // Small delay to let user see the success toast
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setToast({
          isOpen: true,
          type: 'error',
          title: "Failed to Add Transaction",
          message: "Failed to add expense. Please try again."
        })
      }
    } catch (error) {
      console.error("Submit error:", error)
      setToast({
        isOpen: true,
        type: 'error',
        title: "Error",
        message: "An error occurred. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectUser = (user: User) => {
    setSelectedUser(user)
    setSearchQuery(user.name)
    setSearchResults([])
  }

  const clearUserSelection = () => {
    setSelectedUser(null)
    setSearchQuery("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
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

          {/* Person Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Who did you lend/pay money to?
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (selectedUser) {
                    setSelectedUser(null)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Search by name or email..."
                required
              />
              {selectedUser && (
                <button
                  type="button"
                  onClick={clearUserSelection}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none cursor-pointer"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3">
                <div className="text-gray-600 dark:text-gray-400">Searching...</div>
              </div>
            )}
          </div>

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
              disabled={isLoading || !selectedUser}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 
                         text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                         disabled:bg-gray-400 dark:disabled:bg-gray-600 cursor-pointer transition-colors"
            >
              {isLoading ? "Adding..." : "Add Transaction"}
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