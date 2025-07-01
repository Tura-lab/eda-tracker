"use client"

import { useState, useEffect } from "react"
import Toast from "./Toast"

interface Transaction {
  id: string
  amount: number
  description: string
  created_at: string
  type: 'lent' | 'borrowed'
  other_person: {
    name: string
    email: string
  }
}

interface EditTransactionModalProps {
  isOpen: boolean
  transaction: Transaction | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditTransactionModal({ isOpen, transaction, onClose, onSuccess }: EditTransactionModalProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'error',
    title: "",
    message: ""
  })

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString())
      setDescription(transaction.description)
    }
  }, [transaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!transaction || !amount || !description) {
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
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
        }),
      })

      if (response.ok) {
        setToast({
          isOpen: true,
          type: 'success',
          title: "Success!",
          message: "Transaction updated successfully."
        })
        onSuccess()
        // Small delay to let user see the success toast
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        const errorText = await response.text()
        setToast({
          isOpen: true,
          type: 'error',
          title: "Update Failed",
          message: `Failed to update transaction: ${errorText}`
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

  if (!isOpen || !transaction) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {transaction.type === 'lent' ? 'Money lent to' : 'Money borrowed from'}:
          </p>
          <p className="font-medium">{transaction.other_person.name}</p>
          <p className="text-sm text-gray-500">{transaction.other_person.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (ETB)
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

          {/* Description */}
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 cursor-pointer"
            >
              {isLoading ? "Updating..." : "Update Transaction"}
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