"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DebugInfo {
  supabaseUrl: string
  hasAnonKey: boolean
  clientCreated: boolean
  connectionTest: {
    success: boolean
    error?: string
  }
  environmentVariables: {
    [key: string]: string | undefined
  }
}

export function SupabaseDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const { createClient, checkSupabaseConnection } = await import("@/lib/supabase/client")
      const { ENV, validateEnvironment } = await import("@/lib/env")

      const config = {
        url: ENV.SUPABASE_URL,
        anonKey: ENV.SUPABASE_ANON_KEY
      }
      const validation = validateEnvironment()

      let connectionTest = { success: false, error: "Not tested" }
      let clientCreated = false

      try {
        const client = createClient()
        clientCreated = true
        const result = await checkSupabaseConnection()
        connectionTest = {
          success: result.connected,
          error: result.connected ? undefined : result.error
        }
      } catch (error) {
        connectionTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }

      setDebugInfo({
        supabaseUrl: config?.url || "Not configured",
        hasAnonKey: !!config?.anonKey,
        clientCreated,
        connectionTest,
        environmentVariables: {
          NEXT_PUBLIC_SUPABASE_URL: ENV.SUPABASE_URL,
          NEXT_PUBLIC_APP_URL: ENV.APP_URL,
          NODE_ENV: ENV.NODE_ENV,
          hasAnonKey: ENV.SUPABASE_ANON_KEY ? "✓ Present" : "✗ Missing",
          validationStatus: validation.valid ? "✓ Valid" : `✗ Invalid: ${validation.errors.join(", ")}`,
        },
      })
    } catch (error) {
      console.error("Debug diagnostics failed:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Running Diagnostics...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!debugInfo) {
    return (
      <Alert>
        <AlertDescription>Failed to run diagnostics. Please check the console for errors.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Configuration Debug</CardTitle>
          <CardDescription>Diagnostic information for troubleshooting Supabase connection issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Connection Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Client Created:</span>
                  <Badge variant={debugInfo.clientCreated ? "default" : "destructive"}>
                    {debugInfo.clientCreated ? "✓ Success" : "✗ Failed"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Connection Test:</span>
                  <Badge variant={debugInfo.connectionTest.success ? "default" : "destructive"}>
                    {debugInfo.connectionTest.success ? "✓ Connected" : "✗ Failed"}
                  </Badge>
                </div>
                {debugInfo.connectionTest.error && (
                  <p className="text-sm text-red-600 mt-1">Error: {debugInfo.connectionTest.error}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Configuration</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Supabase URL:</span>
                  <Badge variant={debugInfo.supabaseUrl !== "Not configured" ? "default" : "destructive"}>
                    {debugInfo.supabaseUrl !== "Not configured" ? "✓ Set" : "✗ Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Anon Key:</span>
                  <Badge variant={debugInfo.hasAnonKey ? "default" : "destructive"}>
                    {debugInfo.hasAnonKey ? "✓ Present" : "✗ Missing"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Environment Variables</h4>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm font-mono">
              {Object.entries(debugInfo.environmentVariables).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className="text-gray-900">{value || "undefined"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={runDiagnostics} className="w-full">
              Re-run Diagnostics
            </Button>
          </div>
        </CardContent>
      </Card>

      {debugInfo.supabaseUrl !== "Not configured" && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Supabase URL:</strong>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">{debugInfo.supabaseUrl}</code>
              </div>
              <div>
                <strong>Project ID:</strong>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                  {debugInfo.supabaseUrl.includes("supabase.co")
                    ? debugInfo.supabaseUrl.split("//")[1]?.split(".")[0]
                    : "Unknown"}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
