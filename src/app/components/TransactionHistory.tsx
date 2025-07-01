"use client"

import { useState, useEffect } from "react"

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

interface TransactionHistoryProps {
  refreshTrigger: number // Used to refresh when new transactions are added
}

export default function TransactionHistory({ refreshTrigger }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'lent' | 'borrowed'>('all')
  const [nameFilter, setNameFilter] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<{name: string, email: string} | null>(null)
  const [availablePeople, setAvailablePeople] = useState<{name: string, email: string}[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

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
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.type === filter)
    }

    // Apply person filter
    if (selectedPerson) {
      filtered = filtered.filter(t => 
        t.other_person.email === selectedPerson.email
      )
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1) // Reset to first page when filters change
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

  if (loading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <div className="text-center text-gray-500">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Transaction History</h2>
        
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            {selectedPerson && (
              <button
                type="button"
                onClick={clearPersonSelection}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && getFilteredPeople().length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {getFilteredPeople().map((person, index) => (
                <button
                  key={`${person.email}-${index}`}
                  type="button"
                  onClick={() => selectPerson(person)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="font-medium text-black">{person.name}</div>
                  <div className="text-sm text-gray-600">{person.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs sm:text-sm ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('lent')}
            className={`px-3 py-1 rounded text-xs sm:text-sm ${
              filter === 'lent' 
                ? 'bg-green-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Lent
          </button>
          <button
            onClick={() => setFilter('borrowed')}
            className={`px-3 py-1 rounded text-xs sm:text-sm ${
              filter === 'borrowed' 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Borrowed
          </button>
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <>
          {/* Pagination info */}
          <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
            <span>
              Showing {startItem}-{endItem} of {filteredTransactions.length} transactions
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="space-y-3">
            {paginatedTransactions.map((transaction) => (
            <div key={transaction.id} className="bg-white p-3 sm:p-4 rounded border">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      transaction.type === 'lent' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="font-medium text-sm sm:text-base">
                      {transaction.type === 'lent' ? 'Lent to' : 'Borrowed from'} {transaction.other_person.name}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm mb-1">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className={`font-bold text-lg sm:text-base ${
                    transaction.type === 'lent' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'lent' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </p>
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
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    return null
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'border hover:bg-gray-100'
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
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">
          {selectedPerson 
            ? `No transactions found with ${selectedPerson.name}.`
            : filter === 'all' 
              ? "No transactions yet." 
              : `No ${filter} transactions yet.`
          }
        </div>
      )}
    </div>
  )
} 