'use client'

import type React from 'react'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  AlertCircle,
  Loader2,
  Github,
  Mail,
  ArrowRight,
  CheckCircle,
  Building2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useBranding } from '@/components/branding-provider'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const branding = useBranding()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!orgName.trim()) {
      setError('Organization name is required')
      setLoading(false)
      return
    }

    try {
      // Dynamically import to prevent SSR issues
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            org_name: orgName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGithubSignup = async () => {
    if (!orgName.trim()) {
      setError('Organization name is required')
      return
    }
    setGithubLoading(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      // Store org name in a cookie before GitHub OAuth
      document.cookie = `signup_org_name=${encodeURIComponent(orgName)}; path=/; max-age=300`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
        document.cookie = 'signup_org_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    } catch (err) {
      console.error('GitHub signup error:', err)
      setError('Failed to authenticate with GitHub. Please try again.')
      document.cookie = 'signup_org_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    } finally {
      setGithubLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
        <Link href="/" className="flex items-center space-x-2">
          {branding?.logoUrl && (
            <img src={branding.logoUrl} alt="Logo" className="h-12 w-12 rounded bg-white border" />
          )}
          <span className="text-2xl font-bold text-gray-900">
            {branding?.companyName || 'AssetTracker Pro'}
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {success ? (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="space-y-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
                <CardDescription className="text-center">
                  We've sent a confirmation link to your email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <AlertDescription className="text-blue-800">
                      Please check <span className="font-medium">{email}</span> and click the
                      confirmation link to complete your registration.
                    </AlertDescription>
                  </div>
                </Alert>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>After confirming your email, you'll be able to sign in to your account.</p>
                  <p className="text-xs text-gray-500">
                    If you don't see the email, check your spam folder or{' '}
                    <Link
                      href="/auth/resend"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      request a new link
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    Go to Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="space-y-1">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  Create your account
                </CardTitle>
                <CardDescription className="text-center">
                  Join AssetTracker Pro to start managing your assets efficiently
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="Enter your organization name"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Tabs defaultValue="github" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="github">GitHub</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                  </TabsList>
                  <TabsContent value="github" className="space-y-4 pt-4">
                    <div className="text-sm text-center text-gray-600 mb-2">
                      Sign up quickly using your GitHub account
                    </div>
                    <Button
                      onClick={handleGithubSignup}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                      disabled={githubLoading}
                    >
                      {githubLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Github className="mr-2 h-4 w-4" />
                      )}
                      Continue with GitHub
                    </Button>
                    <div className="text-xs text-center text-gray-500">
                      We'll never post anything without your permission
                    </div>
                  </TabsContent>
                  <TabsContent value="email" className="space-y-4 pt-4">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          <Link
                            href="/auth/reset-password"
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a secure password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                        <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
                          </>
                        ) : (
                          'Create account'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-4 text-center text-sm">
                  <p className="text-gray-600">
                    By signing up, you agree to our{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Separator />
                <div className="text-center text-sm w-full">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AssetTracker Pro. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
