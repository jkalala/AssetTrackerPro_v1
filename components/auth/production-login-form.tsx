"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Package, Github, Mail, Eye, EyeOff, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useBranding } from "@/components/branding-provider"

export default function ProductionLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const branding = useBranding()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError("Failed to initiate GitHub login")
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError("Failed to initiate Google login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center space-y-2 mb-6">
            {branding?.logoUrl && (
              <img src={branding.logoUrl} alt="Logo" className="h-12 w-12 rounded bg-white border" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {branding?.companyName || "AssetTracker Pro"}
            </h1>
          </div>
          <p className="text-gray-600">Professional Asset Management System</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* GitHub Login */}
            <Button variant="outline" className="w-full" onClick={handleGitHubLogin} disabled={loading}>
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>

            <Button variant="outline" className="w-full mt-2" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><g><path fill="#4285F4" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.484 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.773 3.953 1.477l2.703-2.633c-1.711-1.594-3.922-2.57-6.656-2.57-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.156-1.602z"/><path fill="#34A853" d="M3.545 7.545l3.273 2.402c.891-1.242 2.273-2.047 3.887-2.047.992 0 1.922.344 2.641.914l3.164-3.086c-1.422-1.32-3.242-2.128-5.305-2.128-3.242 0-5.977 2.203-6.953 5.219z"/><path fill="#FBBC05" d="M12.705 21.455c2.484 0 4.57-.82 6.094-2.234l-2.812-2.305c-.773.547-1.758.867-3.281.867-2.523 0-4.664-1.703-5.43-4.008l-3.273 2.531c1.406 2.953 4.484 5.149 8.702 5.149z"/><path fill="#EA4335" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.484 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.773 3.953 1.477l2.703-2.633c-1.711-1.594-3.922-2.57-6.656-2.57-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.156-1.602z"/></g></svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                Forgot your password?
              </Link>
            </div>

            <Separator />

            <div className="text-center">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Link href="/signup" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 AssetTracker Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
