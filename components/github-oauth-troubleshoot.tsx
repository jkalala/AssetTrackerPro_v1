"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { useState } from "react"

export default function GitHubOAuthTroubleshoot() {
  const [copied, setCopied] = useState<string | null>(null)

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : ""
  const callbackUrl = "https://wyqohljdnrouovuqqdlt.supabase.co/auth/v1/callback"

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Fix "This Site is Blocked" Error
          </CardTitle>
          <CardDescription>GitHub OAuth configuration issue - here's how to fix it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Issue:</strong> Your GitHub OAuth app is configured for localhost:3000, but you're
              accessing from: <code className="bg-red-100 px-1 rounded">{currentOrigin}</code>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 text-lg">✅ Quick Fix: Use Email Auth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-sm mb-3">
                  Email authentication works immediately without any OAuth setup required.
                </p>
                <Button asChild className="w-full">
                  <a href="/signup">Sign Up with Email</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 text-lg">🔧 Fix GitHub OAuth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 text-sm mb-3">Update your GitHub OAuth app to work with v0 preview.</p>
                <Button asChild variant="outline" className="w-full">
                  <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer">
                    Open GitHub Settings <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Option 1: Update Existing GitHub OAuth App</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-sm">1. Update Homepage URL to:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentOrigin, "homepage")}
                    className="h-6 px-2"
                  >
                    {copied === "homepage" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <code className="bg-white px-3 py-2 rounded border text-sm block break-all">{currentOrigin}</code>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-sm">2. Keep Authorization callback URL as:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(callbackUrl, "callback")}
                    className="h-6 px-2"
                  >
                    {copied === "callback" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <code className="bg-white px-3 py-2 rounded border text-sm block break-all">{callbackUrl}</code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Option 2: Create New GitHub OAuth App (Recommended)</h3>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Creating a new OAuth app is often faster and avoids conflicts with existing configurations.
              </AlertDescription>
            </Alert>
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to{" "}
                  <a
                    href="https://github.com/settings/applications/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    GitHub → New OAuth App <ExternalLink className="h-3 w-3 inline ml-1" />
                  </a>
                </li>
                <li>
                  <strong>Application name:</strong> AssetTracker Pro v0
                </li>
                <li>
                  <strong>Homepage URL:</strong> <code className="bg-white px-1 rounded text-xs">{currentOrigin}</code>
                </li>
                <li>
                  <strong>Authorization callback URL:</strong>{" "}
                  <code className="bg-white px-1 rounded text-xs">{callbackUrl}</code>
                </li>
                <li>Click "Register application"</li>
                <li>Copy the new Client ID and Client Secret</li>
                <li>
                  Update them in your{" "}
                  <a
                    href="https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Supabase Dashboard <ExternalLink className="h-3 w-3 inline ml-1" />
                  </a>
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Option 3: Download and Run Locally</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-700 text-sm mb-3">
                Your existing GitHub OAuth app is already configured for localhost:3000. Download the code and run it
                locally for immediate GitHub OAuth functionality.
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Homepage URL:</strong> <code>http://localhost:3000</code> ✅ Already configured
                </p>
                <p>
                  <strong>Callback URL:</strong> <code>{callbackUrl}</code> ✅ Already configured
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> After making changes to GitHub OAuth settings, wait 2-3 minutes before
              testing. GitHub needs time to propagate the changes.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="w-full">
              <a href="/signup">Try Email Signup</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener noreferrer">
                Create New OAuth App <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a
                href="https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/auth/providers"
                target="_blank"
                rel="noopener noreferrer"
              >
                Update Supabase <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
