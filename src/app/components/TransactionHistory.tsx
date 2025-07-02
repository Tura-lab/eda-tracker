"use client"

import { useState, useEffect } from "react"
import EditTransactionModal from "./EditTransactionModal"
import ConfirmationModal from "./ConfirmationModal"
import Toast from "./Toast"

interface Transaction {
  id: string
  amount: number
  description: string
  created_at: string
  type: 'lent' | 'borrowed'
  is_payment: boolean
  can_edit: boolean
  receipt_url?: string
  other_person: {
    name: string
    email: string
  }
}

interface TransactionHistoryProps {
  refreshTrigger: number // Used to refresh when new transactions are added
  onTransactionChange?: () => void // Callback to refresh balances when transactions change
}

export default function TransactionHistory({ refreshTrigger, onTransactionChange }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'lent' | 'borrowed' | 'payment'>('all')
  const [nameFilter, setNameFilter] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<{name: string, email: string} | null>(null)
  const [availablePeople, setAvailablePeople] = useState<{name: string, email: string}[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  // Selection state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [toast, setToast] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'error',
    title: "",
    message: ""
  })

  useEffect(() => {
    fetchTransactions()
  }, [refreshTrigger])

  useEffect(() => {
    // Extract unique people from transactions
    const people = new Map()
    transactions.forEach(transaction => {
      const person = transaction.other_person
      people.set(person.email, person)
    })
    setAvailablePeople(Array.from(people.values()))
  }, [transactions])

  useEffect(() => {
    // Apply filters
    let filtered = transactions

    // Apply type filter
    if (filter === 'payment') {
      filtered = filtered.filter(t => t.is_payment)
    } else if (filter !== 'all') {
      filtered = filtered.filter(t => t.type === filter && !t.is_payment)
    }

    // Apply person filter
    if (selectedPerson) {
      filtered = filtered.filter(t => 
        t.other_person.email === selectedPerson.email
      )
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1) // Reset to first page when filters change
    setSelectedTransactions(new Set()) // Clear selections when filters change
  }, [transactions, filter, selectedPerson])

  useEffect(() => {
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedTransactions(filteredTransactions.slice(startIndex, endIndex))
  }, [filteredTransactions, currentPage, itemsPerPage])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        console.error("Failed to fetch transactions")
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Selection handlers
  const toggleTransactionSelection = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactions(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedTransactions.size === paginatedTransactions.length) {
      // Deselect all
      setSelectedTransactions(new Set())
    } else {
      // Select all visible (paginated) transactions
      const allVisible = new Set(paginatedTransactions.map(t => t.id))
      setSelectedTransactions(allVisible)
    }
  }

  const handleBulkDelete = () => {
    if (selectedTransactions.size === 0) return
    setIsBulkDeleteModalOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedTransactions.size === 0) return

    setIsDeleting(true)
    const failedDeletes: string[] = []

    try {
      // Delete transactions one by one
      for (const transactionId of selectedTransactions) {
        try {
          const response = await fetch(`/api/transactions/${transactionId}`, {
            method: "DELETE",
          })
          if (!response.ok) {
            failedDeletes.push(transactionId)
          }
        } catch (error) {
          console.error("Bulk delete error:", error)
          failedDeletes.push(transactionId)
        }
      }

      if (failedDeletes.length === 0) {
        setToast({
          isOpen: true,
          type: 'success',
          title: "Success!",
          message: `${selectedTransactions.size} transaction(s) deleted successfully.`
        })
      } else {
        setToast({
          isOpen: true,
          type: 'error',
          title: "Partial Success",
          message: `${selectedTransactions.size - failedDeletes.length} transactions deleted. ${failedDeletes.length} failed to delete.`
        })
      }

      // Refresh data
      fetchTransactions()
      onTransactionChange?.()
      setSelectedTransactions(new Set()) // Clear selections
      
    } catch (error) {
      console.error("Bulk delete error:", error)
      setToast({
        isOpen: true,
        type: 'error',
        title: "Error",
        message: "An error occurred while deleting transactions."
      })
    } finally {
      setIsDeleting(false)
      setIsBulkDeleteModalOpen(false)
    }
  }



  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getFilteredPeople = () => {
    if (!nameFilter.trim()) return []
    return availablePeople.filter(person =>
      person.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
      person.email.toLowerCase().includes(nameFilter.toLowerCase())
    )
  }

  const selectPerson = (person: {name: string, email: string}) => {
    setSelectedPerson(person)
    setNameFilter(person.name)
    setShowDropdown(false)
  }

  const clearPersonSelection = () => {
    setSelectedPerson(null)
    setNameFilter('')
    setShowDropdown(false)
  }

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, filteredTransactions.length)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditModalOpen(true)
  }

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingTransaction) return

    try {
      const response = await fetch(`/api/transactions/${deletingTransaction.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTransactions() // Refresh the list
        onTransactionChange?.() // Refresh balances
        setIsDeleteModalOpen(false)
        setDeletingTransaction(null)
        setToast({
          isOpen: true,
          type: 'success',
          title: "Success!",
          message: "Transaction deleted successfully."
        })
      } else {
        const errorText = await response.text()
        setToast({
          isOpen: true,
          type: 'error',
          title: "Delete Failed",
          message: `Failed to delete transaction: ${errorText}`
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      setToast({
        isOpen: true,
        type: 'error',
        title: "Error",
        message: "An error occurred while deleting the transaction."
      })
    }
  }

  const handleEditSuccess = () => {
    fetchTransactions() // Refresh the list
    onTransactionChange?.() // Refresh balances
    setIsEditModalOpen(false)
    setEditingTransaction(null)
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Transaction History</h2>
        <div className="text-center text-gray-500 dark:text-gray-400">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Transaction History</h2>
        
        {/* Search by name */}
        <div className="mb-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by person's name or email..."
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value)
                setShowDropdown(e.target.value.length > 0 && !selectedPerson)
                if (selectedPerson && e.target.value !== selectedPerson.name) {
                  setSelectedPerson(null)
                }
              }}
              onFocus={() => setShowDropdown(nameFilter.length > 0 && !selectedPerson)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400"
            />
            {selectedPerson && (
              <button
                type="button"
                onClick={clearPersonSelection}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && getFilteredPeople().length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {getFilteredPeople().map((person, index) => (
                <button
                  key={`${person.email}-${index}`}
                  type="button"
                  onClick={() => selectPerson(person)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none cursor-pointer"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{person.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{person.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs sm:text-sm cursor-pointer transition-colors ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('lent')}
            className={`px-3 py-1 rounded text-xs sm:text-sm cursor-pointer transition-colors ${
              filter === 'lent' 
                ? 'bg-green-500 text-white' 
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Lent
          </button>
          <button
            onClick={() => setFilter('borrowed')}
            className={`px-3 py-1 rounded text-xs sm:text-sm cursor-pointer transition-colors ${
              filter === 'borrowed' 
                ? 'bg-red-500 text-white' 
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Borrowed
          </button>
          <button
            onClick={() => setFilter('payment')}
            className={`px-3 py-1 rounded text-xs sm:text-sm cursor-pointer transition-colors ${
              filter === 'payment' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Payments
          </button>
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <>
          {/* Selection and pagination info */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <span>
                Showing {startItem}-{endItem} of {filteredTransactions.length} transactions
              </span>
              {selectedTransactions.size > 0 && (
                <span className="font-medium text-blue-600 dark:text-blue-400 text-xs sm:text-sm px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                  {selectedTransactions.size} selected
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Bulk actions and select all */}
          {paginatedTransactions.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                    onChange={toggleSelectAll}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select all on page
                  </span>
                </label>
              </div>
              
              {selectedTransactions.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 
                             text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 
                             disabled:opacity-50 cursor-pointer transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>
                    {isDeleting ? "Deleting..." : (
                      <>
                        <span className="sm:hidden">Delete ({selectedTransactions.size})</span>
                        <span className="hidden sm:inline">Delete {selectedTransactions.size} selected</span>
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="space-y-3">
            {paginatedTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-white dark:bg-gray-700 p-3 sm:p-4 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start space-x-3">
                    {/* Selection checkbox */}
                    <div className="flex-shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.id)}
                        onChange={() => toggleTransactionSelection(transaction.id)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              transaction.type === 'lent' ? 'bg-green-500' : 'bg-red-500'
                            }`}></span>
                            <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                              {transaction.is_payment 
                                ? `Paid ${transaction.type === 'lent' ? 'to' : 'by'} ${transaction.other_person.name}`
                                : `${transaction.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${transaction.other_person.name}`
                              }
                              {transaction.receipt_url && (
                                <span className="ml-2">
                                  <a 
                                    href={transaction.receipt_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-xs"
                                    title="View receipt"
                                  >
                                    📄 Receipt
                                  </a>
                                </span>
                              )}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1">{transaction.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.created_at)}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className={`font-bold text-lg sm:text-base ${
                            transaction.type === 'lent' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'lent' ? '+' : '-'}{transaction.amount.toFixed(2)} ETB
                          </p>
                        </div>
                      </div>
                      
                      {/* Edit/Delete buttons - only show if user can edit */}
                      {transaction.can_edit && (
                        <div className="flex space-x-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            title="Edit transaction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                            title="Delete transaction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer
                           text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current page
                  const showPage = page === 1 || 
                                  page === totalPages || 
                                  (page >= currentPage - 1 && page <= currentPage + 1)
                  
                  if (!showPage) {
                    // Show ellipsis for gaps
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-400 dark:text-gray-500">...</span>
                    }
                    return null
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded text-sm cursor-pointer transition-colors ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer
                           text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {selectedPerson 
            ? `No transactions found with ${selectedPerson.name}.`
            : filter === 'all' 
              ? "No transactions yet." 
              : `No ${filter} transactions yet.`
          }
        </div>
      )}
      
      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        transaction={editingTransaction}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingTransaction(null)
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction: "${deletingTransaction?.description}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setDeletingTransaction(null)
        }}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        title="Delete Multiple Transactions"
        message={`Are you sure you want to delete ${selectedTransactions.size} selected transaction(s)? This action cannot be undone.`}
        confirmText={`Delete ${selectedTransactions.size} transactions`}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmBulkDelete}
        onCancel={() => {
          setIsBulkDeleteModalOpen(false)
        }}
      />

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