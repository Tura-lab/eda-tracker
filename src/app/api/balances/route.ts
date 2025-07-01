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

  const { data, error } = await supabase
    .from("user_balances")
    .select("*")
    .eq("user_id", session.user.id)

  if (error) {
    console.error("Supabase query error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  // Separate into who owes me vs who I owe
  const whoOwesMe = data.filter(balance => balance.net_balance > 0)
  const whoIOwe = data.filter(balance => balance.net_balance < 0)

  return NextResponse.json({
    whoOwesMe,
    whoIOwe
  })
} 