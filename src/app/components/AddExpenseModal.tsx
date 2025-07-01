"use client"

import { useState, useEffect } from "react"

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
  const [type, setType] = useState<"lend" | "borrow">("lend")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

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
      alert("Please fill in all fields")
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
        setType("lend")
        setSearchQuery("")
        setSelectedUser(null)
        setDescription("")
        onSuccess()
        onClose()
      } else {
        alert("Failed to add expense. Please try again.")
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert("An error occurred. Please try again.")
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
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Add Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="0.00"
              required
            />
          </div>

          {/* Lend/Borrow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="lend"
                  checked={type === "lend"}
                  onChange={(e) => setType(e.target.value as "lend" | "borrow")}
                  className="mr-2"
                />
                <span className="text-sm sm:text-base">I lent money</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="borrow"
                  checked={type === "borrow"}
                  onChange={(e) => setType(e.target.value as "lend" | "borrow")}
                  className="mr-2"
                />
                <span className="text-sm sm:text-base">I borrowed money</span>
              </label>
            </div>
          </div>

          {/* Person Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === "lend" ? "Who do you lent money to?" : "Who did you borrow from?"}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Search by name or email..."
                required
              />
              {selectedUser && (
                <button
                  type="button"
                  onClick={clearUserSelection}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <div className="font-medium text-black">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                <div className="text-gray-600">Searching...</div>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="e.g., Dinner, Gas money, Concert tickets..."
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 