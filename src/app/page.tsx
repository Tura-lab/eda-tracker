"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import AddExpenseModal from "./components/AddExpenseModal"
import TransactionHistory from "./components/TransactionHistory"

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

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (status === "authenticated" && !session.user?.name) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>
  }

  if (session) {
  return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {session.user?.name}!</h1>
              <p className="text-gray-600 text-sm sm:text-base">{session.user?.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base cursor-pointer"
              >
                Add Transaction
              </button>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm sm:text-base cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Loading indicator overlay */}
          {initialLoading && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-40 text-sm">
              Loading balances...
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* People who owe me money */}
              <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <h2 className="text-lg sm:text-xl font-semibold text-green-800 mb-4">
                  People who owe me money
                </h2>
                {balances?.whoOwesMe?.length ? (
                  <div className="space-y-3">
                    {balances.whoOwesMe.map((balance) => (
                      <div key={balance.other_user_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded border space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{balance.other_user_name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 break-all">{balance.other_user_email}</p>
                        </div>
                        <p className="text-green-600 font-bold text-lg sm:text-base self-start sm:self-center">
                          +{Math.abs(balance.net_balance).toFixed(2)} ETB
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm sm:text-base">No one owes you money right now.</p>
                )}
              </div>

              {/* People I owe money to */}
              <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200">
                <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-4">
                  People I owe money to
                </h2>
                {balances?.whoIOwe?.length ? (
                  <div className="space-y-3">
                    {balances.whoIOwe.map((balance) => (
                      <div key={balance.other_user_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded border space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{balance.other_user_name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 break-all">{balance.other_user_email}</p>
                        </div>
                        <p className="text-red-600 font-bold text-lg sm:text-base self-start sm:self-center">
                          -{Math.abs(balance.net_balance).toFixed(2)} ETB
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm sm:text-base">You don&apos;t owe anyone money right now.</p>
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
      <p>Not signed in</p>
      <button
        onClick={() => signIn("google")}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
      >
        Sign in with Google
      </button>
    </div>
  )
}
