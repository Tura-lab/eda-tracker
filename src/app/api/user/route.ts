import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { name } = await req.json()

  if (!name) {
    return new Response("Name is required", { status: 400 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      db: { schema: 'next_auth' }
    }
  )

  const { data, error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", session.user.id)
    .select()

  if (error) {
    console.error("Supabase update error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  return NextResponse.json(data)
} 