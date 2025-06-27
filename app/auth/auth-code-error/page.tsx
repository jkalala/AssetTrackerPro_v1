"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "Authentication failed"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            Authentication Error
          </CardTitle>
          <CardDescription className="text-center">There was a problem confirming your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">This could happen if:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>The confirmation link has expired</li>
                <li>The link has already been used</li>
                <li>There was a network error</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/signup">Try Signing Up Again</Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
