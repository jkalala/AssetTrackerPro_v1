"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"

export default function ProfileCheck() {
  const [profileStatus, setProfileStatus] = useState<"checking" | "exists" | "missing" | "error">("checking")
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  const checkProfile = async () => {
    try {
      setProfileStatus("checking")
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("No authenticated user found")
        setProfileStatus("error")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code === "PGRST116") {
        setProfileStatus("missing")
      } else if (profileError) {
        setError(profileError.message)
        setProfileStatus("error")
      } else {
        setProfileStatus("exists")
      }
    } catch (err) {
      setError("Failed to check profile")
      setProfileStatus("error")
    }
  }

  const createProfile = async () => {
    try {
      setCreating(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("No authenticated user found")
        return
      }

      const { error: createError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        role: "user",
      })

      if (createError) {
        setError(createError.message)
      } else {
        setProfileStatus("exists")
        // Refresh the page to update the UI
        window.location.reload()
      }
    } catch (err) {
      setError("Failed to create profile")
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    checkProfile()
  }, [])

  if (profileStatus === "checking") {
    return (
      <Alert>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertDescription>Checking user profile...</AlertDescription>
      </Alert>
    )
  }

  if (profileStatus === "exists") {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">User profile is properly configured</AlertDescription>
      </Alert>
    )
  }

  if (profileStatus === "missing") {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Profile Setup Required
          </CardTitle>
          <CardDescription className="text-orange-700">
            Your user profile needs to be created before you can add assets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your user profile is missing from the database. This is required to create assets.
              </AlertDescription>
            </Alert>

            <Button onClick={createProfile} disabled={creating} className="w-full">
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Create User Profile"
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Error checking profile: {error}
        <Button variant="outline" size="sm" onClick={checkProfile} className="ml-2">
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}
