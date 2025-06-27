"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, RefreshCw, User } from "lucide-react"
import { createUserProfile, checkUserProfile } from "@/lib/profile-actions"

export default function ProfileSetup() {
  const [profileStatus, setProfileStatus] = useState<"checking" | "exists" | "missing" | "error">("checking")
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    role: "user",
  })

  const checkProfile = async () => {
    try {
      setProfileStatus("checking")
      setError(null)

      const result = await checkUserProfile()

      if (result.error) {
        setError(result.error)
        setProfileStatus("error")
        return
      }

      if (result.user) {
        setUserInfo(result.user)
        // Pre-fill form with user metadata
        setFormData({
          full_name:
            result.user.user_metadata?.full_name ||
            result.user.user_metadata?.name ||
            result.user.email?.split("@")[0] ||
            "",
          role: "user",
        })
      }

      if (result.exists) {
        setProfileStatus("exists")
      } else {
        setProfileStatus("missing")
      }
    } catch (err) {
      console.error("Unexpected error checking profile:", err)
      setError("Failed to check profile")
      setProfileStatus("error")
    }
  }

  const createProfile = async () => {
    try {
      setCreating(true)
      setError(null)

      const result = await createUserProfile({
        full_name: formData.full_name,
        role: formData.role,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setProfileStatus("exists")
        // Refresh the page to update all components
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (err) {
      console.error("Unexpected error creating profile:", err)
      setError("An unexpected error occurred while creating your profile")
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
        <AlertDescription className="text-green-800">
          ✅ User profile is properly configured. You can now add assets!
        </AlertDescription>
      </Alert>
    )
  }

  if (profileStatus === "missing") {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Complete Your Profile Setup
          </CardTitle>
          <CardDescription className="text-orange-700">
            We need to create your user profile to enable asset management features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Profile Required:</strong> Your user profile is missing from the database. This is required to
              create and manage assets.
            </AlertDescription>
          </Alert>

          {userInfo && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Account Information</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Email:</strong> {userInfo.email}
                </p>
                <p>
                  <strong>User ID:</strong> {userInfo.id}
                </p>
                <p>
                  <strong>Auth Provider:</strong> {userInfo.app_metadata?.provider || "email"}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <Button onClick={createProfile} disabled={creating} className="w-full">
            {creating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Create My Profile
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={checkProfile}>
                    Retry Check
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Why is this needed?</strong> Your profile stores essential information like your name and role,
            which is required for asset ownership and team collaboration features.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Profile Check Failed:</strong> {error}
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={checkProfile}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Check
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
