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
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [description, setDescription] = useState("")
  const [receiptUrl, setReceiptUrl] = useState("")
  const [isPayment, setIsPayment] = useState(false)
  const [isSplit, setIsSplit] = useState(false)
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
    
    if (selectedUsers.length === 0 || !amount || !description) {
      setToast({
        isOpen: true,
        type: 'error',
        title: "Missing Information",
        message: "Please select at least one person, enter an amount, and fill in the description"
      })
      return
    }

    if (parseFloat(amount) <= 0) {
      setToast({
        isOpen: true,
        type: 'error',
        title: "Invalid Amount",
        message: "Amount must be greater than 0"
      })
      return
    }

    setIsLoading(true)

    try {
      let transactionAmount: number
      
      if (isSplit) {
        // Split the amount among all selected people plus the current user
        const totalPeople = selectedUsers.length + 1 // +1 for current user
        transactionAmount = parseFloat(amount) / totalPeople
        
        // Validate that the split amount is reasonable
        if (transactionAmount < 0.01) {
          setToast({
            isOpen: true,
            type: 'error',
            title: "Amount Too Small",
            message: "The split amount per person would be less than 0.01 ETB. Please increase the total amount or reduce the number of people."
          })
          setIsLoading(false)
          return
        }
      } else {
        // Each person owes the full amount
        transactionAmount = parseFloat(amount)
      }

      // Create transactions for each selected user
      const transactions = selectedUsers.map(user => ({
        amount: Math.round(transactionAmount * 100) / 100, // Round to 2 decimal places
        type,
        otherUserId: user.id,
        description: isSplit ? `${description} (Split: ${(Math.round(transactionAmount * 100) / 100).toFixed(2)} ETB each)` : description,
        receiptUrl: receiptUrl.trim() || undefined,
        isPayment,
      }))

      const response = await fetch("/api/expenses/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions }),
      })

      if (response.ok) {
        // Reset form
        setAmount("")
        setSelectedUsers([])
        setSearchQuery("")
        setDescription("")
        setReceiptUrl("")
        setIsPayment(false)
        setIsSplit(false)
        setToast({
          isOpen: true,
          type: 'success',
          title: "Success!",
          message: isSplit 
            ? `${transactions.length} transaction(s) added successfully. Amount split among ${selectedUsers.length + 1} people.`
            : `${transactions.length} transaction(s) added successfully.`
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
          title: "Failed to Add Transactions",
          message: "Failed to add transactions. Please try again."
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

  const addUser = (user: User) => {
    setSelectedUsers(prev => [...prev, user])
    setSearchQuery("")
    setSearchResults([])
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId))
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

          {/* Person Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Who did you lend/pay money to?
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Search by name or email..."
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addUser(user)}
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

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected People
              </label>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUser(user.id)}
                      className="ml-3 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {selectedUsers.length > 0 && amount && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  <span className="font-medium text-blue-800 dark:text-blue-300">
                    {isSplit 
                      ? `Each person will owe: ${(Math.round((parseFloat(amount || "0") / (selectedUsers.length + 1)) * 100) / 100).toFixed(2)} ETB (split among ${selectedUsers.length + 1} people)`
                      : selectedUsers.length > 1 
                        ? `Each person will owe: ${parseFloat(amount || "0").toFixed(2)} ETB`
                        : `This person will owe: ${parseFloat(amount || "0").toFixed(2)} ETB`
                    }
                  </span>
                </div>
              )}
            </div>
          )}

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

          {/* Split Checkbox */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(e) => setIsSplit(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Split the amount among all selected people plus me
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This will divide the total amount among all selected people and the current user.
                  </p>
                </div>
              </label>
            </div>
          )}

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
              disabled={isLoading || selectedUsers.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 
                         text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                         disabled:bg-gray-400 dark:disabled:bg-gray-600 cursor-pointer transition-colors"
            >
              {isLoading ? "Adding..." : `Add ${selectedUsers.length} Transaction${selectedUsers.length !== 1 ? 's' : ''}`}
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