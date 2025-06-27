"use client"

import type React from "react"
import { AuthProvider } from "./auth-provider"
import { DemoAuthProvider } from "./demo-auth-provider"

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  // Check if we have Supabase environment variables
  const hasSupabaseConfig =
    typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (hasSupabaseConfig) {
    return <AuthProvider>{children}</AuthProvider>
  } else {
    return <DemoAuthProvider>{children}</DemoAuthProvider>
  }
}
