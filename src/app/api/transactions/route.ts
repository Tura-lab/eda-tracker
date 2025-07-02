import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/auth"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  // Get all transactions where user is involved
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, description, created_at, payer_id, recipient_id, receipt_url, is_payment")
    .or(`payer_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Supabase query error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  // Get unique user IDs to fetch user details
  const userIds = new Set<string>()
  data.forEach(transaction => {
    userIds.add(transaction.payer_id)
    userIds.add(transaction.recipient_id)
  })

  // Fetch user details from next_auth schema
  const supabaseAuth = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      db: { schema: 'next_auth' }
    }
  )

  const { data: users, error: usersError } = await supabaseAuth
    .from("users")
    .select("id, name, email")
    .in("id", Array.from(userIds))

  if (usersError) {
    console.error("Supabase users query error:", usersError)
    return new Response("Internal Server Error", { status: 500 })
  }

  // Create a user lookup map
  const userMap = new Map()
  users?.forEach(user => {
    userMap.set(user.id, user)
  })

  // Transform the data to include transaction type and other person info
  const transactions = data.map(transaction => {
    const isLending = transaction.payer_id === session.user.id
    const otherPersonId = isLending ? transaction.recipient_id : transaction.payer_id
    const otherPerson = userMap.get(otherPersonId)
    
    return {
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      created_at: transaction.created_at,
      type: isLending ? 'lent' : 'borrowed',
      receipt_url: transaction.receipt_url,
      is_payment: transaction.is_payment || false,
      can_edit: transaction.payer_id === session.user.id, // Only payer can edit
      other_person: {
        name: otherPerson?.name || 'Unknown',
        email: otherPerson?.email || 'Unknown'
      }
    }
  })

  return NextResponse.json(transactions)
} 