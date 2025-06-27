"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, Copy, CheckCircle, Mail, Github, Settings, AlertTriangle } from "lucide-react"
import { useState } from "react"

export default function SupabaseOAuthSetup() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const githubClientId = "Ov23lipMb8831rUNvsJR"
  const githubClientSecret = "97c8805c06fa9b6589b8d33848a0835873fd2f98"
  const supabaseUrl = "https://wyqohljdnrouovuqqdlt.supabase.co"
  const callbackUrl = `${supabaseUrl}/auth/v1/callback`
  const siteUrl = "https://cloudeleavepro.vercel.app"

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Setup Guide</h1>
        <p className="text-gray-600">Configure email confirmations and GitHub OAuth for your AssetTracker Pro</p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Setup
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub OAuth
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        {/* Email Configuration */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Configuration
              </CardTitle>
              <CardDescription>Set up email confirmations and SMTP settings in Supabase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Email confirmations require proper SMTP configuration in Supabase.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 1: Access Supabase Dashboard</h3>
                  <Button asChild>
                    <a
                      href="https://app.supabase.com/project/wyqohljdnrouovuqqdlt/auth/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      Open Auth Settings <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 2: Configure Site URL</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-sm">Site URL:</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(siteUrl, "siteUrl")}
                        className="h-6 px-2"
                      >
                        {copied === "siteUrl" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <code className="bg-white px-3 py-2 rounded border text-sm block break-all">{siteUrl}</code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 3: Configure Redirect URLs</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-sm">Redirect URLs (add these):</label>
                      </div>
                      <div className="space-y-2">
                        {[
                          `${siteUrl}/auth/callback`,
                          `${siteUrl}/dashboard`,
                          `${siteUrl}/`,
                          "http://localhost:3000/auth/callback",
                          "http://localhost:3000/dashboard",
                          "http://localhost:3000/",
                        ].map((url, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <code className="bg-white px-3 py-2 rounded border text-sm flex-1 mr-2">{url}</code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(url, `redirect-${index}`)}
                              className="h-8 px-2"
                            >
                              {copied === `redirect-${index}` ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 4: Enable Email Confirmations</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm mb-3">In the Auth Settings, ensure these are enabled:</p>
                    <ul className="text-sm space-y-1">
                      <li>✅ Enable email confirmations</li>
                      <li>✅ Enable email change confirmations</li>
                      <li>✅ Enable secure email change</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 5: Configure SMTP (Optional but Recommended)</h3>
                  <Alert>
                    <AlertDescription>
                      For production use, configure custom SMTP settings in the Auth Settings. Without SMTP, Supabase
                      uses their default service which may have limitations.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GitHub OAuth Configuration */}
        <TabsContent value="github" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5 text-gray-900" />
                GitHub OAuth Configuration
              </CardTitle>
              <CardDescription>Set up GitHub OAuth with your provided credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Credentials Provided:</strong> Using your GitHub OAuth app credentials.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 1: Configure in Supabase</h3>
                  <Button asChild>
                    <a
                      href="https://app.supabase.com/project/wyqohljdnrouovuqqdlt/auth/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      Open Auth Providers <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 2: GitHub Provider Settings</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-sm">GitHub Client ID:</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(githubClientId, "clientId")}
                          className="h-6 px-2"
                        >
                          {copied === "clientId" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <code className="bg-white px-3 py-2 rounded border text-sm block break-all">
                        {githubClientId}
                      </code>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-sm">GitHub Client Secret:</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(githubClientSecret, "clientSecret")}
                          className="h-6 px-2"
                        >
                          {copied === "clientSecret" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <code className="bg-white px-3 py-2 rounded border text-sm block break-all">
                        {githubClientSecret}
                      </code>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-sm">Redirect URL:</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(callbackUrl, "callbackUrl")}
                          className="h-6 px-2"
                        >
                          {copied === "callbackUrl" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <code className="bg-white px-3 py-2 rounded border text-sm block break-all">{callbackUrl}</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 3: Update GitHub OAuth App</h3>
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
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm mb-2">In your GitHub OAuth app, update these URLs:</p>
                      <ul className="text-sm space-y-1">
                        <li>
                          <strong>Homepage URL:</strong> {siteUrl}
                        </li>
                        <li>
                          <strong>Authorization callback URL:</strong> {callbackUrl}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Step 4: Enable GitHub Provider</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm mb-2">In Supabase Auth Providers:</p>
                    <ul className="text-sm space-y-1">
                      <li>✅ Enable GitHub provider</li>
                      <li>✅ Enter Client ID and Client Secret</li>
                      <li>✅ Save configuration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Testing Authentication
              </CardTitle>
              <CardDescription>Verify that email confirmations and GitHub OAuth are working</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Email Signup Test</h3>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <a href="/signup">Test Email Signup</a>
                    </Button>
                    <div className="text-sm text-gray-600">
                      <p>Expected behavior:</p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Form submission succeeds</li>
                        <li>Confirmation email is sent</li>
                        <li>Email contains activation link</li>
                        <li>Clicking link activates account</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">GitHub OAuth Test</h3>
                  <div className="space-y-3">
                    <Button asChild className="w-full" variant="outline">
                      <a href="/login">Test GitHub Login</a>
                    </Button>
                    <div className="text-sm text-gray-600">
                      <p>Expected behavior:</p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Redirects to GitHub</li>
                        <li>GitHub authorization page appears</li>
                        <li>After approval, redirects back</li>
                        <li>User is logged in automatically</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Troubleshooting:</strong> If authentication isn't working, check the browser console for
                  errors and verify all URLs are correctly configured in both Supabase and GitHub.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="text-lg font-semibold mb-3">Debug Tools</h3>
                <div className="flex gap-3">
                  <Button asChild variant="outline">
                    <a href="/debug-supabase">Supabase Debug</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/debug-urls">URL Debug</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
