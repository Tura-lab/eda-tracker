import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/auth"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { amount, description, receiptUrl, isPayment = false } = await req.json()

  if (!amount || !description) {
    return new Response("Missing required fields", { status: 400 })
  }

  if (amount <= 0) {
    return new Response("Amount must be positive", { status: 400 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  // First, verify the user owns this transaction (is the payer)
  const { data: existingTransaction, error: fetchError } = await supabase
    .from("expenses")
    .select("payer_id")
    .eq("id", id)
    .single()

  if (fetchError || !existingTransaction) {
    return new Response("Transaction not found", { status: 404 })
  }

  if (existingTransaction.payer_id !== session.user.id) {
    return new Response("You can only edit transactions you created", { status: 403 })
  }

  // Update the transaction
  const { data, error } = await supabase
    .from("expenses")
    .update({
      amount: parseFloat(amount),
      description,
      receipt_url: receiptUrl || null,
      is_payment: Boolean(isPayment),
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()

  if (error) {
    console.error("Supabase update error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  // First, verify the user owns this transaction (is the payer)
  const { data: existingTransaction, error: fetchError } = await supabase
    .from("expenses")
    .select("payer_id")
    .eq("id", id)
    .single()

  if (fetchError || !existingTransaction) {
    return new Response("Transaction not found", { status: 404 })
  }

  if (existingTransaction.payer_id !== session.user.id) {
    return new Response("You can only delete transactions you created", { status: 403 })
  }

  // Delete the transaction
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Supabase delete error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  return new Response("Transaction deleted successfully", { status: 200 })
} 