"use client"

import type React from "react"
import { AuthProvider } from "./auth-provider"
import { DemoAuthProvider } from "./demo-auth-provider"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  // Check if Supabase environment variables are available
  const hasSupabaseConfig =
    typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!hasSupabaseConfig) {
    // Use demo mode if Supabase is not configured
    return <DemoAuthProvider>{children}</DemoAuthProvider>
  }

  // Use real Supabase auth if configured
  return <AuthProvider>{children}</AuthProvider>
}
