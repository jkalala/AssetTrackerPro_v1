"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Download } from "lucide-react"
import ErrorBoundary from "./error-boundary"
import NetworkStatus from "./network-status"
import SupabaseStatus from "./supabase-status"

interface SafeAuthWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function SafeAuthWrapper({ children, fallback }: SafeAuthWrapperProps) {
  const [hasNetworkError, setHasNetworkError] = useState(false)
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)

      // Check if it's a network/fetch error
      if (
        event.reason?.message?.includes("Failed to fetch") ||
        event.reason?.message?.includes("NetworkError") ||
        event.reason?.message?.includes("TypeError")
      ) {
        setHasNetworkError(true)
        setErrorCount((prev) => prev + 1)
        event.preventDefault() // Prevent the error from being logged to console
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  if (hasNetworkError && errorCount > 2) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Network Connection Issues
              </CardTitle>
              <CardDescription className="text-red-700">
                Multiple network errors detected. The v0 preview environment may have connectivity restrictions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Failed:</strong> Unable to connect to the database after multiple attempts.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium text-red-800">Recommended Solutions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2">🏠 Run Locally</h5>
                    <p className="text-sm text-blue-700 mb-3">
                      Download the code and run it locally for full functionality without network restrictions.
                    </p>
                    <Button size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Code
                    </Button>
                  </div>

                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">🔄 Try Again</h5>
                    <p className="text-sm text-green-700 mb-3">
                      Sometimes network issues are temporary. Wait a moment and try refreshing.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setHasNetworkError(false)
                        setErrorCount(0)
                        window.location.reload()
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh & Retry
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>v0 Preview Limitation:</strong> The v0 preview environment may have network restrictions that
                  prevent full database connectivity. This is normal and expected in preview environments.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={fallback}>
      <div className="space-y-4">
        <NetworkStatus />
        {hasNetworkError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Network connectivity issues detected. Some features may not work properly.
              <Button
                size="sm"
                variant="outline"
                className="ml-2"
                onClick={() => {
                  setHasNetworkError(false)
                  setErrorCount(0)
                }}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <SupabaseStatus />
        {children}
      </div>
    </ErrorBoundary>
  )
}
