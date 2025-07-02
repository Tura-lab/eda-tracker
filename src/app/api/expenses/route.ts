import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/auth"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { amount, type, otherUserId, description, receiptUrl, isPayment = false } = await req.json()

  if (!amount || !type || !otherUserId || !description) {
    return new Response("Missing required fields", { status: 400 })
  }

  if (amount <= 0) {
    return new Response("Amount must be positive", { status: 400 })
  }

  if (!['lend', 'borrow'].includes(type)) {
    return new Response("Type must be 'lend' or 'borrow'", { status: 400 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  // For lending: current user is payer, other user is recipient
  // For borrowing: other user is payer, current user is recipient
  const expenseData = {
    amount: parseFloat(amount),
    description,
    payer_id: type === 'lend' ? session.user.id : otherUserId,
    recipient_id: type === 'lend' ? otherUserId : session.user.id,
    receipt_url: receiptUrl || null,
    is_payment: Boolean(isPayment),
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert([expenseData])
    .select()

  if (error) {
    console.error("Supabase insert error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  return NextResponse.json(data)
} 