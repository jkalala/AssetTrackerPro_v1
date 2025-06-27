"use client"

import { useAuth } from "@/components/auth/auth-provider"
import AddAssetForm from "@/components/add-asset-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, LogIn } from "lucide-react"
import Link from "next/link"

export default function AddAssetPage() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading...
            </CardTitle>
            <CardDescription>Checking your authentication status</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Required</CardTitle>
            <CardDescription>
              {error
                ? `Authentication error: ${error}`
                : "You must be logged in to add assets. Please sign in to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login?redirect=/add-asset">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <AddAssetForm />
    </div>
  )
}
