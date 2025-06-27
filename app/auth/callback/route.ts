import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const provider = requestUrl.searchParams.get("provider")

  console.log("Auth callback received:", { code: !!code, error, provider })

  // if "next" is in param, use it as the redirect URL
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  // Handle error cases
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`,
    )
  }

  // Check if we have Supabase configuration
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!hasSupabaseConfig) {
    console.log("No Supabase configuration found, redirecting to demo")
    return NextResponse.redirect(`${requestUrl.origin}/demo`)
  }

  if (code) {
    try {
      const supabase = await createClient()

      console.log("Exchanging code for session...")
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}`,
        )
      }

      console.log("Session created successfully, user:", data.user?.id)

      if (data.user) {
        // Check if user profile exists, create if not
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single()

        if (profileError && profileError.code === "PGRST116") {
          console.log("Creating new profile for user:", data.user.id)
          // Profile doesn't exist, create it
          let fullName = null
          let avatarUrl = null

          if (data.user.app_metadata?.provider === "github") {
            fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || null
            avatarUrl = data.user.user_metadata?.avatar_url || null
            console.log("GitHub user metadata:", data.user.user_metadata)
          } else if (data.user.app_metadata?.provider === "google") {
            fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || null
            avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null
          } else {
            // Email signup
            fullName = data.user.user_metadata?.full_name || null
          }

          const { error: insertError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: "user",
          })

          if (insertError) {
            console.error("Profile creation error:", insertError)
            // Continue to dashboard even if profile creation fails
          } else {
            console.log("Profile created successfully")
          }
        } else if (profileError) {
          console.error("Profile check error:", profileError)
          // Continue to dashboard even if profile check fails
        } else {
          console.log("User profile already exists")
        }
      }

      // Successful authentication - redirect to dashboard
      console.log("Redirecting to dashboard after successful authentication")
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (err) {
      console.error("Unexpected auth callback error:", err)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/auth-code-error?error=${encodeURIComponent("Authentication failed")}`,
      )
    }
  }

  // No code provided - redirect to login
  console.log("No auth code provided, redirecting to login")
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
