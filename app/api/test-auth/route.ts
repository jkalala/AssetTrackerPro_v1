import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Test auth API called")
    
    const supabase = await createClient()
    console.log("Supabase client created in API")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("API user check result:", { user: user?.id, userError })

    if (userError) {
      console.error("API user check error:", userError)
      return NextResponse.json({ error: userError.message })
    }

    if (!user) {
      console.log("No user found in API")
      return NextResponse.json({ user: null, authenticated: false })
    }

    console.log("User found in API:", user.id)

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }, 
      authenticated: true 
    })
  } catch (error) {
    console.error("API test auth error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    })
  }
} 