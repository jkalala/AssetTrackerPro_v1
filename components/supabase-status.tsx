"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, RefreshCw, Database } from "lucide-react"

export default function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error" | "offline">("checking")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const checkSupabaseConnection = async () => {
    try {
      setStatus("checking")
      setError(null)

      // Check if we have the required environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        setError("Supabase environment variables are missing")
        setStatus("error")
        return
      }

      // Try to make a simple request to Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "HEAD",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      })

      if (response.ok) {
        setStatus("connected")
      } else {
        throw new Error(`Supabase responded with status: ${response.status}`)
      }
    } catch (err) {
      console.error("Supabase connection error:", err)
      setError(err instanceof Error ? err.message : "Failed to connect to Supabase")
      setStatus("error")
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    checkSupabaseConnection()
  }

  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  if (status === "checking") {
    return (
      <Alert>
        <Database className="h-4 w-4 animate-pulse" />
        <AlertDescription>Checking database connection...</AlertDescription>
      </Alert>
    )
  }

  if (status === "connected") {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">✅ Database connection is working properly</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Database Connection Issue
        </CardTitle>
        <CardDescription className="text-red-700">
          Unable to connect to the database. This may be a temporary network issue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium text-red-800">Possible Solutions:</h4>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Wait a moment and try again</li>
            <li>The v0 preview environment may have network restrictions</li>
          </ul>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection ({retryCount})
          </Button>
          <Button onClick={() => window.location.reload()} size="sm">
            Refresh Page
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> If you're in the v0 preview environment, some network requests may be restricted.
            Consider downloading the code and running it locally for full functionality.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
