"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAuthRedirectUrl } from "@/lib/supabase/config"

const getURL = () => {
  let url = process.env.NEXT_PUBLIC_APP_URL ?? "https://cloudeleavepro.vercel.app"
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`
  return url
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Sign in error:", error)
    return { error: error.message }
  }

  return { success: true }
}

export async function signUpWithEmail(
  email: string, 
  password: string, 
  fullName: string,
  orgName?: string
) {
  const supabase = await createClient()

  const redirectUrl = getAuthRedirectUrl()
  console.log("Signup redirect URL:", redirectUrl)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
        org_name: orgName
      },
    },
  })

  if (error) {
    console.error("Sign up error:", error)
    return { error: error.message }
  }

  // Check if user needs email confirmation
  if (data.user && !data.user.email_confirmed_at) {
    console.log("User created, email confirmation required:", data.user.id)
    return {
      success: true,
      needsConfirmation: true,
      message: "Please check your email for a confirmation link to complete your registration.",
    }
  }

  // User is already confirmed (auto-confirm is enabled)
  if (data.user && data.user.email_confirmed_at) {
    console.log("User created and auto-confirmed:", data.user.id)
    return {
      success: true,
      needsConfirmation: false,
      message: "Account created successfully! You can now sign in.",
    }
  }

  return { success: true }
}

export async function signInWithGitHub() {
  const supabase = await createClient()

  const redirectUrl = getAuthRedirectUrl()
  console.log("GitHub OAuth redirect URL:", redirectUrl)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      }
    },
  })

  if (error) {
    console.error("GitHub OAuth error:", error)
    return { error: error.message }
  }

  if (data.url) {
    console.log("Redirecting to GitHub OAuth:", data.url)
    redirect(data.url)
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Sign out error:", error)
  }

  redirect("/login")
}

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const redirectUrl = getAuthRedirectUrl("/auth/reset-password")
  console.log("Password reset redirect URL:", redirectUrl)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) {
    console.error("Password reset error:", error)
    return { error: error.message }
  }

  return {
    success: true,
    message: "Password reset email sent! Please check your inbox.",
  }
}

export async function resendConfirmation(email: string) {
  const supabase = await createClient()

  const redirectUrl = getAuthRedirectUrl()
  console.log("Resend confirmation redirect URL:", redirectUrl)

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) {
    console.error("Resend confirmation error:", error)
    return { error: error.message }
  }

  return {
    success: true,
    message: "Confirmation email resent! Please check your inbox.",
  }
}
