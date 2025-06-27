"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, CheckCircle } from "lucide-react"
import { useState } from "react"

export default function GitHubOAuthSetup() {
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
          <CardTitle>GitHub OAuth Setup for v0 Preview</CardTitle>
          <CardDescription>Configure GitHub OAuth to work with the current preview environment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              You're currently viewing this app in the v0 preview environment. To enable GitHub OAuth, you need to
              update your GitHub OAuth app settings.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Update GitHub OAuth App</h3>
            <div className="space-y-3">
              <Button asChild>
                <a
                  href="https://github.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  Open GitHub Developer Settings <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <p className="text-sm text-gray-600">Click on your "AssetTracker Pro" OAuth app to edit it.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Update URLs</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-sm">Homepage URL:</label>
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
                  <label className="font-medium text-sm">Authorization callback URL:</label>
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
            <h3 className="text-lg font-semibold">Step 3: Save and Test</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Copy the URLs above and paste them into your GitHub OAuth app settings</li>
              <li>Click "Update application" in GitHub</li>
              <li>Wait a few minutes for changes to propagate</li>
              <li>Return to the login page and try "Continue with GitHub"</li>
            </ol>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Alternative:</strong> You can also download this code and run it locally at http://localhost:3000
              where GitHub OAuth is already configured to work.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">For Local Development</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm mb-2">If you prefer to run locally:</p>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Homepage URL:</strong> <code>http://localhost:3000</code>
                </p>
                <p>
                  <strong>Authorization callback URL:</strong> <code>{callbackUrl}</code>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
