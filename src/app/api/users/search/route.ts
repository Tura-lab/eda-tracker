import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json([])
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
    .select("id, name, email")
    .neq("id", session.user.id) // Exclude current user
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error("Supabase search error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }

  return NextResponse.json(data)
} 