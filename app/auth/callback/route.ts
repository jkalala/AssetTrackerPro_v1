import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const provider = requestUrl.searchParams.get("provider")

  console.log("Auth callback received:", { code: !!code, error, provider })

  // if "next" is in param, use it as the redirect URL
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  // Handle error cases
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return redirect("/auth/auth-code-error")
  }

  // Check if we have Supabase configuration
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!hasSupabaseConfig) {
    console.log("No Supabase configuration found, redirecting to demo")
    return redirect("/demo")
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = await createClient()

    console.log("Exchanging code for session...")
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError)
      return redirect("/auth/auth-code-error")
    }

    console.log("Session created successfully, user:", data.user?.id)

    if (data.user) {
      // Get user data
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("No user found after code exchange")
        return redirect("/auth/auth-code-error")
      }

      // Get full name from user metadata
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null
      const avatarUrl = user.user_metadata?.avatar_url || null

      // Get organization name from metadata or cookie
      let orgName = user.user_metadata?.org_name
      if (!orgName) {
        // Try to get from cookie for GitHub signups
        const signupOrgName = cookieStore.get("signup_org_name")
        if (signupOrgName) {
          orgName = decodeURIComponent(signupOrgName.value)
          // Clear the cookie
          cookieStore.delete("signup_org_name")
        }
      }

      // Create profile if it doesn't exist
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!existingProfile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: "admin", // First user is admin
          email: user.email
        })

        if (insertError) {
          console.error("Profile creation error:", insertError)
        } else {
          console.log("Profile created successfully")

          // Create default tenant for the user
          const { data: tenant, error: tenantError } = await supabase.from("tenants").insert({
            name: orgName || `${fullName}'s Organization`,
            plan: "free",
            status: "active",
            max_users: 5,
            max_assets: 100,
            features: {
              qrCodes: true,
              analytics: false,
              api: false,
              customBranding: false,
              multipleLocations: false,
              advancedReports: false
            }
          }).select().single()

          if (tenantError) {
            console.error("Tenant creation error:", tenantError)
          } else if (tenant) {
            // Update profile with tenant info and make user the owner
            const { error: updateError } = await supabase.from("profiles")
              .update({
                tenant_id: tenant.id,
                role: "owner"
              })
              .eq("id", user.id)

            if (updateError) {
              console.error("Profile update error:", updateError)
            }
          }
        }
      }

      // Successful authentication - redirect to dashboard
      console.log("Redirecting to dashboard after successful authentication")
      return redirect(next)
    }
  }

  // No code provided - redirect to login
  console.log("No auth code provided, redirecting to login")
  return redirect("/login")
}
