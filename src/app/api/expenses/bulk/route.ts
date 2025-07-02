import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/auth"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

interface TransactionData {
  amount: number
  type: 'lend' | 'borrow'
  otherUserId: string
  description: string
  isPayment: boolean
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { transactions } = await req.json()

  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return new Response("Transactions array is required", { status: 400 })
  }

  // Validate each transaction
  for (const transaction of transactions) {
    const { amount, type, otherUserId, description } = transaction

    if (!amount || !type || !otherUserId || !description) {
      return new Response("Missing required fields in one or more transactions", { status: 400 })
    }

    if (amount <= 0) {
      return new Response("Amount must be positive", { status: 400 })
    }

    if (!['lend', 'borrow'].includes(type)) {
      return new Response("Type must be 'lend' or 'borrow'", { status: 400 })
    }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  // Prepare expense data for bulk insert
  const expenseDataArray = transactions.map((transaction: TransactionData) => ({
    amount: parseFloat(transaction.amount.toString()),
    description: transaction.description,
    payer_id: transaction.type === 'lend' ? session.user.id : transaction.otherUserId,
    recipient_id: transaction.type === 'lend' ? transaction.otherUserId : session.user.id,
    is_payment: Boolean(transaction.isPayment),
  }))

  const { data, error } = await supabase
    .from("expenses")
    .insert(expenseDataArray)
    .select()

  if (error) {
    console.error("Supabase bulk insert error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    count: data.length,
    transactions: data 
  })
} 