'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'

export default function AuthDebug() {
  const [status, setStatus] = useState<{
    supabase: 'loading' | 'connected' | 'error'
    auth: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
    user: any
    session: any
    error: string | null
  }>({
    supabase: 'loading',
    auth: 'loading',
    user: null,
    session: null,
    error: null,
  })

  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Check Supabase connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setStatus({
          supabase: 'error',
          auth: 'error',
          user: null,
          session: null,
          error: sessionError.message,
        })
        return
      }

      setStatus({
        supabase: 'connected',
        auth: sessionData.session ? 'authenticated' : 'unauthenticated',
        user: sessionData.session?.user || null,
        session: sessionData.session,
        error: null,
      })
    } catch (error) {
      setStatus({
        supabase: 'error',
        auth: 'error',
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const testSignIn = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setStatus(prev => ({ ...prev, error: error.message }))
      } else {
        console.log('OAuth initiated successfully:', data)
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    } finally {
      setLoading(false)
    }
  }

  const testServerAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-auth', {
        method: 'GET',
        credentials: 'include',
      })

      const result = await response.json()
      console.log('Server auth test result:', result)

      if (result.error) {
        setStatus(prev => ({ ...prev, error: result.error }))
      } else {
        setStatus(prev => ({
          ...prev,
          supabase: 'connected',
          auth: result.user ? 'authenticated' : 'unauthenticated',
          user: result.user,
        }))
      }
    } catch (error) {
      console.error('Server auth test error:', error)
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Authentication Debug</h1>
        <Button onClick={checkStatus} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Environment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Environment Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Supabase URL:</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'default' : 'destructive'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Supabase Anon Key:</span>
              <Badge
                variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'default' : 'destructive'}
              >
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">App URL:</span>
              <Badge variant="outline">
                {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Environment:</span>
              <Badge variant="outline">{process.env.NODE_ENV || 'development'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Connection Status
            {status.supabase === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status.supabase === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {status.supabase === 'loading' && <RefreshCw className="h-5 w-5 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Supabase Connection:</span>
            <Badge
              variant={
                status.supabase === 'connected'
                  ? 'default'
                  : status.supabase === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {status.supabase === 'connected' && '✅ Connected'}
              {status.supabase === 'error' && '❌ Error'}
              {status.supabase === 'loading' && '⏳ Loading'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Authentication Status:</span>
            <Badge
              variant={
                status.auth === 'authenticated'
                  ? 'default'
                  : status.auth === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {status.auth === 'authenticated' && '✅ Authenticated'}
              {status.auth === 'unauthenticated' && '❌ Not Authenticated'}
              {status.auth === 'error' && '❌ Error'}
              {status.auth === 'loading' && '⏳ Loading'}
            </Badge>
          </div>

          {status.user && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">User Info:</h4>
              <pre className="text-xs overflow-auto">{JSON.stringify(status.user, null, 2)}</pre>
            </div>
          )}

          {status.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
          <CardDescription>Test authentication functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={testSignIn} disabled={loading} variant="outline">
              Test GitHub Sign In
            </Button>
            <Button onClick={testServerAuth} disabled={loading} variant="outline">
              Test Server Auth
            </Button>
            <Button asChild variant="outline">
              <a href="/login" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Login Page
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/signup" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Signup Page
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
