"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, AlertTriangle } from "lucide-react"

export default function GitHubOAuthFix() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Fix "This Site is Blocked" Error
          </CardTitle>
          <CardDescription>Follow these steps to resolve GitHub OAuth issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The "This site is blocked" error usually means your GitHub OAuth app configuration doesn't match your
              current setup.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Update GitHub OAuth App</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="font-medium">Go to your GitHub OAuth App settings:</p>
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                GitHub Developer Settings <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Verify These Exact URLs</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="font-medium text-sm text-gray-600">Homepage URL:</p>
                <code className="bg-white px-2 py-1 rounded border text-sm">http://localhost:3000</code>
              </div>
              <div>
                <p className="font-medium text-sm text-gray-600">Authorization callback URL:</p>
                <code className="bg-white px-2 py-1 rounded border text-sm">
                  https://wyqohljdnrouovuqqdlt.supabase.co/auth/v1/callback
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Alternative - Create New OAuth App</h3>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm">If the issue persists, create a new GitHub OAuth app:</p>
              <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
                <li>Go to GitHub Settings → Developer settings → OAuth Apps</li>
                <li>Click "New OAuth App"</li>
                <li>
                  Use these settings:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Application name: AssetTracker Pro Dev</li>
                    <li>Homepage URL: http://localhost:3000</li>
                    <li>Authorization callback URL: https://wyqohljdnrouovuqqdlt.supabase.co/auth/v1/callback</li>
                  </ul>
                </li>
                <li>Get the new Client ID and Client Secret</li>
                <li>Update them in your Supabase dashboard</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Check for Common Issues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">❌ Common Mistakes</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Wrong callback URL (missing /auth/v1/callback)</li>
                  <li>• Using https for localhost</li>
                  <li>• Trailing slashes in URLs</li>
                  <li>• App in pending/suspended state</li>
                </ul>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">✅ Correct Setup</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Exact URL matches</li>
                  <li>• App is active and approved</li>
                  <li>• Client ID/Secret correctly entered</li>
                  <li>• No extra characters or spaces</li>
                </ul>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Pro Tip:</strong> After making changes to your GitHub OAuth app, wait a few minutes before
              testing. GitHub sometimes takes time to propagate changes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
