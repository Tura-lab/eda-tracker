"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { format, subDays } from "date-fns"
import Logo from "../components/Logo"
import ThemeToggle from "../components/ThemeToggle"
import ProfileDropdown from "../components/ProfileDropdown"

interface AnalysisData {
  dailyExpenses: { date: string; amount: number }[]
  lendingData: { date: string; amount: number }[]
  borrowingData: { date: string; amount: number }[]
  monthlyAverages: { month: string; avgExpense: number; avgLending: number; avgBorrowing: number }[]
  summary: {
    totalExpenses: number
    totalLending: number
    totalBorrowing: number
    netBalance: number
  }
}

export default function AnalysisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))

  const fetchAnalysisData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateRange === 'custom') {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      } else {
        params.append('range', dateRange)
      }
      params.append('month', selectedMonth)

      const response = await fetch(`/api/analysis?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysisData(data)
      } else {
        console.error("Failed to fetch analysis data")
        setError("Failed to fetch financial analysis data.")
      }
    } catch (error) {
      console.error("Error fetching analysis data:", error)
      setError("An error occurred while fetching financial analysis data.")
    } finally {
      setLoading(false)
    }
  }, [dateRange, customStartDate, customEndDate, selectedMonth])

  useEffect(() => {
    if (status === "authenticated" && !session.user?.name) {
      router.push("/welcome")
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === "authenticated" && session.user?.name) {
      fetchAnalysisData()
    }
  }, [status, session, dateRange, customStartDate, customEndDate, selectedMonth, fetchAnalysisData])

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case 'custom': return `${format(new Date(customStartDate), 'MMM dd')} - ${format(new Date(customEndDate), 'MMM dd, yyyy')}`
      default: return 'Last 30 days'
    }
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (status === "authenticated" && !session.user?.name) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>
  }

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">Please sign in to view analysis.</div>
  }

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
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/analysis')}
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Analysis
                </button>
              </div>
            </div>
            
            {/* Right side - Refresh, Theme toggle and Profile */}
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAnalysisData}
                disabled={loading}
                className="p-2 rounded-full cursor-pointer transition-colors
                           bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 
                           hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500
                           disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh analysis data"
              >
                <svg 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
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

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Financial Analysis</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your expenses, lending, and borrowing patterns</p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'custom')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Analysis Content */}
          {!loading && !error && analysisData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analysisData.summary.totalExpenses.toFixed(2)} ETB
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{getDateRangeLabel()}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Lending</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analysisData.summary.totalLending.toFixed(2)} ETB
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{getDateRangeLabel()}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Borrowing</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {analysisData.summary.totalBorrowing.toFixed(2)} ETB
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{getDateRangeLabel()}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Balance</h3>
                  <p className={`text-2xl font-bold ${analysisData.summary.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {analysisData.summary.netBalance >= 0 ? '+' : ''}{analysisData.summary.netBalance.toFixed(2)} ETB
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{getDateRangeLabel()}</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Expenses Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Expenses</h3>
                  <div className="h-64 flex items-end justify-center space-x-2">
                    {analysisData.dailyExpenses.length > 0 ? (
                      analysisData.dailyExpenses.map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className="w-8 bg-blue-500 rounded-t"
                            style={{ height: `${Math.max((item.amount / Math.max(...analysisData.dailyExpenses.map(d => d.amount))) * 200, 4)}px` }}
                          ></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format(new Date(item.date), 'MM/dd')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-center">
                        No expense data for selected period
                      </div>
                    )}
                  </div>
                </div>

                {/* Lending vs Borrowing Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lending vs Borrowing</h3>
                  <div className="h-64 flex items-end justify-center space-x-8">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-16 bg-green-500 rounded-t"
                        style={{ height: `${Math.max((analysisData.summary.totalLending / Math.max(analysisData.summary.totalLending, analysisData.summary.totalBorrowing)) * 200, 4)}px` }}
                      ></div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400 mt-2">Lending</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {analysisData.summary.totalLending.toFixed(2)} ETB
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-16 bg-red-500 rounded-t"
                        style={{ height: `${Math.max((analysisData.summary.totalBorrowing / Math.max(analysisData.summary.totalLending, analysisData.summary.totalBorrowing)) * 200, 4)}px` }}
                      ></div>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">Borrowing</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {analysisData.summary.totalBorrowing.toFixed(2)} ETB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Monthly Averages Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Averages</h3>
                  <div className="h-64 flex items-end justify-center space-x-2">
                    {analysisData.monthlyAverages.length > 0 ? (
                      analysisData.monthlyAverages.map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div className="flex space-x-1">
                            <div 
                              className="w-4 bg-blue-500 rounded-t"
                              style={{ height: `${Math.max((item.avgExpense / Math.max(...analysisData.monthlyAverages.map(m => m.avgExpense))) * 150, 4)}px` }}
                            ></div>
                            <div 
                              className="w-4 bg-green-500 rounded-t"
                              style={{ height: `${Math.max((item.avgLending / Math.max(...analysisData.monthlyAverages.map(m => m.avgLending))) * 150, 4)}px` }}
                            ></div>
                            <div 
                              className="w-4 bg-red-500 rounded-t"
                              style={{ height: `${Math.max((item.avgBorrowing / Math.max(...analysisData.monthlyAverages.map(m => m.avgBorrowing))) * 150, 4)}px` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format(new Date(item.month + '-01'), 'MMM yy')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-center">
                        No monthly data available
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center space-x-4 mt-4 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                      <span className="text-gray-600 dark:text-gray-400">Expenses</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                      <span className="text-gray-600 dark:text-gray-400">Lending</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                      <span className="text-gray-600 dark:text-gray-400">Borrowing</span>
                    </div>
                  </div>
                </div>

                {/* Trend Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trend Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Expense Trend</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {analysisData.dailyExpenses.length > 1 ? 
                          (analysisData.dailyExpenses[0].amount > analysisData.dailyExpenses[analysisData.dailyExpenses.length - 1].amount ? '↗️ Increasing' : '↘️ Decreasing') : 
                          'No trend data'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Lending Trend</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {analysisData.lendingData.length > 1 ? 
                          (analysisData.lendingData[0].amount > analysisData.lendingData[analysisData.lendingData.length - 1].amount ? '↗️ Increasing' : '↘️ Decreasing') : 
                          'No trend data'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Borrowing Trend</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {analysisData.borrowingData.length > 1 ? 
                          (analysisData.borrowingData[0].amount > analysisData.borrowingData[analysisData.borrowingData.length - 1].amount ? '↗️ Increasing' : '↘️ Decreasing') : 
                          'No trend data'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}