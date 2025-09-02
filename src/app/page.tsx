"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import AddExpenseModal from "./components/AddExpenseModal"
import TransactionHistory from "./components/TransactionHistory"
import Logo from "./components/Logo"
import ThemeToggle from "./components/ThemeToggle"
import ProfileDropdown from "./components/ProfileDropdown"

interface Balance {
  other_user_id: string
  other_user_name: string
  other_user_email: string
  net_balance: number
}

interface BalancesData {
  whoOwesMe: Balance[]
  whoIOwe: Balance[]
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [balances, setBalances] = useState<BalancesData | null>(null)
  const [initialLoading, setInitialLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'owes-me' | 'i-owe'>('owes-me')

  // Function to refresh both balances and transactions
  const refreshData = () => {
    fetchBalances() // Refresh the balances
    setRefreshTrigger(prev => prev + 1) // Trigger transaction history refresh
  }

  useEffect(() => {
    if (status === "authenticated" && !session.user?.name) {
      router.push("/welcome")
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === "authenticated" && session.user?.name) {
      fetchBalances(true) // Initial fetch
    }
  }, [status, session])

  const fetchBalances = async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true)
    }
    try {
      const response = await fetch("/api/balances")
      if (response.ok) {
        const data = await response.json()
        setBalances(data)
        setRefreshTrigger(prev => prev + 1)
      } else {
        console.error("Failed to fetch balances")
      }
    } catch (error) {
      console.error("Error fetching balances:", error)
    } finally {
      if (isInitial) {
        setInitialLoading(false)
      }
    }
  }

  const handleModalSuccess = () => {
    refreshData() // Refresh both balances and transactions after adding a new transaction
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh both balances and transactions
      await fetchBalances()
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error("Manual refresh error:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (status === "authenticated" && !session.user?.name) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>
  }

  if (session) {
    return (
      <div className="min-h-screen">
        {/* Top Navigation Bar */}
        <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Navigation */}
              <div className="flex items-center space-x-8">
                <Logo size={40} />
                <div className="hidden md:flex space-x-6">
                  <button
                    onClick={() => router.push('/')}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/analysis')}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Analysis
                  </button>
                </div>
              </div>
              
              {/* Right side - Add Transaction (desktop), Refresh, Theme toggle and Profile */}
              <div className="flex items-center space-x-3">
                {/* Add Transaction Button - Desktop only */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="hidden sm:flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 
                             text-white rounded-md text-sm font-medium cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Transaction
                </button>
                
                {/* Refresh Button - Desktop only */}
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="hidden sm:flex p-2 rounded-full cursor-pointer transition-colors
                             bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 
                             hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh all data"
                >
                  <svg 
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                </button>
                
                <ThemeToggle />
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation and Add Transaction Button - Shows below header on mobile only */}
        <div className="block sm:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 mb-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/analysis')}
                className="flex-1 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md text-sm font-medium transition-colors"
              >
                Analysis
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 
                           text-white rounded-md text-sm font-medium cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Transaction
              </button>
              
              {/* Refresh Button - Mobile */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-3 rounded-md cursor-pointer transition-colors
                           bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 
                           hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500
                           disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh all data"
              >
                <svg 
                  className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Loading indicator overlay */}
            {initialLoading && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-40 text-sm">
                Loading balances...
              </div>
            )}

            {/* Desktop Layout - Grid */}
            <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* People who owe me money */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 sm:p-6 rounded-lg border border-green-200 dark:border-green-800">
                <h2 className="text-lg sm:text-xl font-semibold text-green-800 dark:text-green-400 mb-4">
                  People who owe me money
                </h2>
                {balances?.whoOwesMe?.length ? (
                  <div className="space-y-3">
                    {balances.whoOwesMe.map((balance) => (
                      <div key={balance.other_user_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 
                                                                  bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 
                                                                  space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{balance.other_user_name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all">{balance.other_user_email}</p>
                        </div>
                        <p className="text-green-600 dark:text-green-400 font-bold text-lg sm:text-base self-start sm:self-center">
                          +{Math.abs(balance.net_balance).toFixed(2)} ETB
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No one owes you money right now.</p>
                )}
              </div>

              {/* People I owe money to */}
              <div className="bg-red-50 dark:bg-red-900/20 p-4 sm:p-6 rounded-lg border border-red-200 dark:border-red-800">
                <h2 className="text-lg sm:text-xl font-semibold text-red-800 dark:text-red-400 mb-4">
                  People I owe money to
                </h2>
                {balances?.whoIOwe?.length ? (
                  <div className="space-y-3">
                    {balances.whoIOwe.map((balance) => (
                      <div key={balance.other_user_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 
                                                                  bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 
                                                                  space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{balance.other_user_name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all">{balance.other_user_email}</p>
                        </div>
                        <p className="text-red-600 dark:text-red-400 font-bold text-lg sm:text-base self-start sm:self-center">
                          -{Math.abs(balance.net_balance).toFixed(2)} ETB
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">You don&apos;t owe anyone money right now.</p>
                )}
              </div>
            </div>

            {/* Mobile Layout - Tabs */}
            <div className="block sm:hidden">
              {/* Tab Navigation */}
              <div className="flex bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-1 mb-4">
                <button
                  onClick={() => setActiveTab('owes-me')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'owes-me'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Owes Me ({balances?.whoOwesMe?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('i-owe')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'i-owe'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  I Owe ({balances?.whoIOwe?.length || 0})
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px]">
                {activeTab === 'owes-me' && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h2 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-4">
                      People who owe me money
                    </h2>
                    {balances?.whoOwesMe?.length ? (
                      <div className="space-y-3">
                        {balances.whoOwesMe.map((balance) => (
                          <div key={balance.other_user_id} className="flex flex-col p-3 
                                                                      bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 
                                                                      space-y-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{balance.other_user_name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 break-all">{balance.other_user_email}</p>
                            </div>
                            <p className="text-green-600 dark:text-green-400 font-bold text-lg self-start">
                              +{Math.abs(balance.net_balance).toFixed(2)} ETB
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No one owes you money right now.</p>
                    )}
                  </div>
                )}

                {activeTab === 'i-owe' && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-4">
                      People I owe money to
                    </h2>
                    {balances?.whoIOwe?.length ? (
                      <div className="space-y-3">
                        {balances.whoIOwe.map((balance) => (
                          <div key={balance.other_user_id} className="flex flex-col p-3 
                                                                      bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 
                                                                      space-y-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{balance.other_user_name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 break-all">{balance.other_user_email}</p>
                            </div>
                            <p className="text-red-600 dark:text-red-400 font-bold text-lg self-start">
                              -{Math.abs(balance.net_balance).toFixed(2)} ETB
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">You don&apos;t owe anyone money right now.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="mt-6 sm:mt-8">
              <TransactionHistory 
                refreshTrigger={refreshTrigger} 
                onTransactionChange={refreshData}
              />
            </div>
          </div>
        </div>

        {/* Modal */}
        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="mb-8">
        <Logo size={64} />
      </div>
      <h1 className="text-2xl font-bold mb-4">Welcome to እዳ Tracker</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        Track money you&apos;ve lent to friends and family. Simple, secure, and easy-to-use.
      </p>
      <button
        onClick={() => signIn("google")}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 
                   text-white rounded-lg cursor-pointer font-medium transition-colors"
        >
        Sign in with Google
      </button>
    </div>
  )
}
