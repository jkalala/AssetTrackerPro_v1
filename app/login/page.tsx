"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Github, Loader2, Shield } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Dynamically import to prevent SSR issues
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        if (data?.session) {
          await fetch("/api/auth/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          })
        }
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    setGithubLoading(true)
    setError(null)

    try {
      // Dynamically import to prevent SSR issues
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      console.error("GitHub login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setGithubLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGithubLoading(true)
    setError(null)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setGithubLoading(false)
    }
  }

  const handleSamlLogin = async () => {
    setGithubLoading(true)
    setError(null)

    try {
      // Redirect to SSO initiation endpoint
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/dashboard'
      const ssoUrl = `/api/auth/sso/initiate?returnUrl=${encodeURIComponent(returnUrl)}`
      window.location.href = ssoUrl
    } catch (err) {
      console.error("SAML login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setGithubLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            type="button" 
            className="w-full" 
            onClick={handleGithubLogin} 
            disabled={githubLoading}
          >
            {githubLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            GitHub
          </Button>
          <Button
            variant="outline"
            type="button"
            className="w-full mt-2"
            onClick={handleGoogleLogin}
            disabled={githubLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><g><path fill="#4285F4" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.484 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.773 3.953 1.477l2.703-2.633c-1.711-1.594-3.922-2.57-6.656-2.57-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.156-1.602z"/><path fill="#34A853" d="M3.545 7.545l3.273 2.402c.891-1.242 2.273-2.047 3.887-2.047.992 0 1.922.344 2.641.914l3.164-3.086c-1.422-1.32-3.242-2.128-5.305-2.128-3.242 0-5.977 2.203-6.953 5.219z"/><path fill="#FBBC05" d="M12.705 21.455c2.484 0 4.57-.82 6.094-2.234l-2.812-2.305c-.773.547-1.758.867-3.281.867-2.523 0-4.664-1.703-5.43-4.008l-3.273 2.531c1.406 2.953 4.484 5.149 8.702 5.149z"/><path fill="#EA4335" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.484 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.773 3.953 1.477l2.703-2.633c-1.711-1.594-3.922-2.57-6.656-2.57-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.156-1.602z"/></g></svg>
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            className="w-full mt-2"
            onClick={handleSamlLogin}
            disabled={githubLoading}
          >
            <Shield className="mr-2 h-4 w-4" />
            Sign in with SAML
          </Button>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-gray-500 text-center w-full">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
