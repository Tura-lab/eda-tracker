import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/auth"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { subDays, format, parseISO } from "date-fns"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '30d'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  // Calculate date range
  let start: Date
  let end: Date = new Date()

  if (startDate && endDate) {
    start = parseISO(startDate)
    end = parseISO(endDate)
  } else {
    switch (range) {
      case '7d':
        start = subDays(new Date(), 7)
        break
      case '90d':
        start = subDays(new Date(), 90)
        break
      default: // 30d
        start = subDays(new Date(), 30)
        break
    }
  }

  // Get transactions within date range
  const { data: transactions, error } = await supabase
    .from("expenses")
    .select("id, amount, description, created_at, payer_id, recipient_id, is_payment")
    .or(`payer_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Supabase query error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  // Process transactions
  const dailyExpenses: { [key: string]: number } = {}
  const dailyLending: { [key: string]: number } = {}
  const dailyBorrowing: { [key: string]: number } = {}
  const monthlyData: { [key: string]: { expenses: number[], lending: number[], borrowing: number[] } } = {}

  let totalExpenses = 0
  let totalLending = 0
  let totalBorrowing = 0

  transactions?.forEach(transaction => {
    const date = format(parseISO(transaction.created_at), 'yyyy-MM-dd')
    const monthKey = format(parseISO(transaction.created_at), 'yyyy-MM')
    const isLending = transaction.payer_id === session.user.id
    const isPayment = transaction.is_payment || false

    // Initialize daily data
    if (!dailyExpenses[date]) dailyExpenses[date] = 0
    if (!dailyLending[date]) dailyLending[date] = 0
    if (!dailyBorrowing[date]) dailyBorrowing[date] = 0

    // Initialize monthly data
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { expenses: [], lending: [], borrowing: [] }
    }

    if (isPayment) {
      // This is a payment transaction
      if (isLending) {
        dailyLending[date] += transaction.amount
        totalLending += transaction.amount
        monthlyData[monthKey].lending.push(transaction.amount)
      } else {
        dailyBorrowing[date] += transaction.amount
        totalBorrowing += transaction.amount
        monthlyData[monthKey].borrowing.push(transaction.amount)
      }
    } else {
      // This is an expense transaction
      dailyExpenses[date] += transaction.amount
      totalExpenses += transaction.amount
      monthlyData[monthKey].expenses.push(transaction.amount)
    }
  })

  // Convert daily data to arrays and fill missing dates
  const dailyExpensesArray = fillMissingDates(dailyExpenses, start, end)
  const dailyLendingArray = fillMissingDates(dailyLending, start, end)
  const dailyBorrowingArray = fillMissingDates(dailyBorrowing, start, end)

  // Calculate monthly averages
  const monthlyAverages = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    avgExpense: data.expenses.length > 0 ? data.expenses.reduce((a, b) => a + b, 0) / data.expenses.length : 0,
    avgLending: data.lending.length > 0 ? data.lending.reduce((a, b) => a + b, 0) / data.lending.length : 0,
    avgBorrowing: data.borrowing.length > 0 ? data.borrowing.reduce((a, b) => a + b, 0) / data.borrowing.length : 0
  }))

  // Sort monthly averages by month
  monthlyAverages.sort((a, b) => a.month.localeCompare(b.month))

  const analysisData = {
    dailyExpenses: dailyExpensesArray,
    lendingData: dailyLendingArray,
    borrowingData: dailyBorrowingArray,
    monthlyAverages,
    summary: {
      totalExpenses,
      totalLending,
      totalBorrowing,
      netBalance: totalLending - totalBorrowing
    }
  }

  return NextResponse.json(analysisData)
}

function fillMissingDates(data: { [key: string]: number }, start: Date, end: Date): { date: string; amount: number }[] {
  const result: { date: string; amount: number }[] = []
  const current = new Date(start)
  
  while (current <= end) {
    const dateKey = format(current, 'yyyy-MM-dd')
    result.push({
      date: dateKey,
      amount: data[dateKey] || 0
    })
    current.setDate(current.getDate() + 1)
  }
  
  return result
}