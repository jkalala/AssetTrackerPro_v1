"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Copy, CheckCircle, AlertTriangle, RefreshCw, Clock } from "lucide-react"
import { useState, useEffect } from "react"

export default function OAuthStatus() {
  const [copied, setCopied] = useState<string | null>(null)
  const [timeWaited, setTimeWaited] = useState(0)

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : ""
  const callbackUrl = "https://wyqohljdnrouovuqqdlt.supabase.co/auth/v1/callback"

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeWaited((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            GitHub OAuth Still Blocked - Advanced Troubleshooting
          </CardTitle>
          <CardDescription>
            You've updated the settings but still getting blocked. Here are additional solutions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Status:</strong> GitHub OAuth is still blocking access to{" "}
              <code className="bg-red-100 px-1 rounded">{currentOrigin}</code>
            </AlertDescription>
          </Alert>

          {/* Timer */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800 font-medium">Time since page load: {formatTime(timeWaited)}</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              GitHub changes can take 2-5 minutes to propagate. If it's been less than 5 minutes, please wait.
            </p>
          </div>

          {/* Immediate Solution */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 text-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />✅ Immediate Solution: Use Email Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 text-sm mb-3">
                Skip GitHub OAuth entirely. Email authentication works perfectly and gives you full access to all
                features.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <a href="/signup">Sign Up with Email Now</a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href="/login">Already have an account? Sign In</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Troubleshooting */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Advanced GitHub OAuth Troubleshooting</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-800 text-base">🔍 Check Current Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Your Homepage URL should be:</label>
                    <div className="flex items-center space-x-2">
                      <code className="bg-white px-2 py-1 rounded border text-xs flex-1 break-all">
                        {currentOrigin}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(currentOrigin, "homepage")}
                        className="h-6 px-2"
                      >
                        {copied === "homepage" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Your Callback URL should be:</label>
                    <div className="flex items-center space-x-2">
                      <code className="bg-white px-2 py-1 rounded border text-xs flex-1 break-all">{callbackUrl}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(callbackUrl, "callback")}
                        className="h-6 px-2"
                      >
                        {copied === "callback" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer">
                      Verify Settings <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 text-base">🆕 Create Fresh OAuth App</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-blue-700 text-sm">
                    Sometimes existing apps have cached settings. Create a completely new one:
                  </p>
                  <ol className="text-xs space-y-1 list-decimal list-inside">
                    <li>Delete your current OAuth app</li>
                    <li>Create a new one with a different name</li>
                    <li>Use the exact URLs shown above</li>
                    <li>Update Supabase with new credentials</li>
                  </ol>
                  <Button asChild variant="outline" className="w-full">
                    <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener noreferrer">
                      Create New App <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Common Issues Checklist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Common Issues Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-red-800">❌ Common Mistakes</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Extra spaces or characters in URLs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Trailing slashes (/) at the end of URLs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Using http instead of https</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>App is in pending/suspended state</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Browser cache issues</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-green-800">✅ What Should Work</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Exact URL matches (no extra characters)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>App status is "Active"</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Client ID/Secret correctly entered in Supabase</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Waited 5+ minutes after changes</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Cleared browser cache</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions to Try</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/login?clear=true">Clear Cache & Retry</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a
                  href="https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Check Supabase <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
              <Button asChild className="w-full">
                <a href="/signup">Use Email Instead</a>
              </Button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Environment</span>
                  <Badge variant="outline">v0 Preview</Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Auth</span>
                  <Badge variant="default">Working</Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">GitHub OAuth</span>
                  <Badge variant="destructive">Blocked</Badge>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommendation:</strong> While troubleshooting GitHub OAuth, use email authentication to test the
              full asset management system. You can always switch to GitHub OAuth later once it's working.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
