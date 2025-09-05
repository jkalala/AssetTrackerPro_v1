'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Copy, ExternalLink, Github, Mail, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SupabaseDashboardGuide() {
  const { toast } = useToast()
  const [copied, setCopied] = useState<Record<string, boolean>>({})

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied({ ...copied, [key]: true })
    toast({
      title: 'Copied to clipboard',
      description: 'Text has been copied to your clipboard',
    })
    setTimeout(() => {
      setCopied({ ...copied, [key]: false })
    }, 2000)
  }

  const SITE_URL = 'https://cloudeleavepro.vercel.app'
  const LOCAL_URL = 'http://localhost:3000'
  const GITHUB_CLIENT_ID = 'Ov23lipMb8831rUNvsJR'
  const GITHUB_CLIENT_SECRET = '97c8805c06fa9b6589b8d33848a0835873fd2f98'

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Supabase Authentication Setup Guide</h1>
      <p className="text-gray-600 mb-8 text-center">
        Follow these steps to configure email confirmations and GitHub OAuth in your Supabase
        project
      </p>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="email">Email Setup</TabsTrigger>
          <TabsTrigger value="github">GitHub OAuth</TabsTrigger>
          <TabsTrigger value="test">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Setup Overview</CardTitle>
              <CardDescription>
                Complete these steps to configure authentication for your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-amber-50 border-amber-200">
                <h3 className="flex items-center text-lg font-medium text-amber-800 mb-2">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Important Note
                </h3>
                <p className="text-amber-700">
                  Auth settings in Supabase can only be configured through the dashboard UI, not
                  through SQL queries. The SQL script provided creates a reference table but doesn't
                  directly modify auth settings.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Run the SQL script</h3>
                    <p className="text-sm text-gray-500">
                      Execute the <code>scripts/11-configure-auth-settings-fixed.sql</code> script
                      to create a reference table
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Configure Email Settings</h3>
                    <p className="text-sm text-gray-500">
                      Set up email confirmations in the Supabase dashboard
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Configure GitHub OAuth</h3>
                    <p className="text-sm text-gray-500">
                      Set up GitHub authentication with the provided credentials
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium">Test Authentication</h3>
                    <p className="text-sm text-gray-500">
                      Verify that email confirmations and GitHub login work correctly
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <a
                  href="https://app.supabase.com/project/_/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Supabase Dashboard <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Email Confirmation Setup
              </CardTitle>
              <CardDescription>
                Configure email confirmations in your Supabase project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Step 1: Configure Site URL</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Set your site URL in the Supabase dashboard
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="site-url">Site URL</Label>
                    <div className="flex gap-2">
                      <Input id="site-url" value={SITE_URL} readOnly className="flex-1" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(SITE_URL, 'site-url')}
                      >
                        {copied['site-url'] ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Navigate to: Authentication → URL Configuration → Site URL
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Step 2: Configure Redirect URLs</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add these redirect URLs to your Supabase project
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Production Redirect URLs</Label>
                      <div className="space-y-2">
                        {[`${SITE_URL}/auth/callback`, `${SITE_URL}/dashboard`, `${SITE_URL}/`].map(
                          (url, i) => (
                            <div key={i} className="flex gap-2">
                              <Input value={url} readOnly className="flex-1" />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(url, `prod-url-${i}`)}
                              >
                                {copied[`prod-url-${i}`] ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Local Development Redirect URLs</Label>
                      <div className="space-y-2">
                        {[
                          `${LOCAL_URL}/auth/callback`,
                          `${LOCAL_URL}/dashboard`,
                          `${LOCAL_URL}/`,
                        ].map((url, i) => (
                          <div key={i} className="flex gap-2">
                            <Input value={url} readOnly className="flex-1" />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(url, `local-url-${i}`)}
                            >
                              {copied[`local-url-${i}`] ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Navigate to: Authentication → URL Configuration → Redirect URLs
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Step 3: Configure Email Provider</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Enable and configure the Email provider
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Enable Email provider</span>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Disable "Confirm email" only for development</span>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Enable "Secure email change"</span>
                    </div>

                    <p className="text-xs text-gray-500">
                      Navigate to: Authentication → Providers → Email
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <a
                  href="https://app.supabase.com/project/_/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Configure Email Settings <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="github">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Github className="mr-2 h-5 w-5" />
                GitHub OAuth Setup
              </CardTitle>
              <CardDescription>
                Configure GitHub authentication with your credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Step 1: Enable GitHub Provider</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Enable the GitHub provider in your Supabase project
                  </p>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Navigate to Authentication → Providers → GitHub and enable it</span>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Step 2: Configure GitHub Credentials</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your GitHub OAuth credentials to Supabase
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="github-client-id">Client ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="github-client-id"
                          value={GITHUB_CLIENT_ID}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(GITHUB_CLIENT_ID, 'github-client-id')}
                        >
                          {copied['github-client-id'] ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="github-client-secret">Client Secret</Label>
                      <div className="flex gap-2">
                        <Input
                          id="github-client-secret"
                          value={GITHUB_CLIENT_SECRET}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            copyToClipboard(GITHUB_CLIENT_SECRET, 'github-client-secret')
                          }
                        >
                          {copied['github-client-secret'] ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Step 3: Configure GitHub OAuth App</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Update your GitHub OAuth app with the correct callback URL
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="github-callback">Callback URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="github-callback"
                          value="https://wyqohljdnrouovuqqdlt.supabase.co/auth/v1/callback"
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            copyToClipboard(
                              'https://wyqohljdnrouovuqqdlt.supabase.co/auth/v1/callback',
                              'github-callback'
                            )
                          }
                        >
                          {copied['github-callback'] ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Add this URL to your GitHub OAuth app's "Authorization callback URL" field
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="github-homepage">Homepage URL</Label>
                      <div className="flex gap-2">
                        <Input id="github-homepage" value={SITE_URL} readOnly className="flex-1" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(SITE_URL, 'github-homepage')}
                        >
                          {copied['github-homepage'] ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Add this URL to your GitHub OAuth app's "Homepage URL" field
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button asChild className="w-full">
                <a
                  href="https://app.supabase.com/project/_/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Configure GitHub Provider <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a
                  href="https://github.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Update GitHub OAuth App <Github className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Authentication</CardTitle>
              <CardDescription>
                Verify that your authentication configuration is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Email Authentication</h3>
                  <p className="text-sm text-gray-500 mb-4">Test email signup and confirmation</p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium">Sign up with a new email</h3>
                        <p className="text-sm text-gray-500">
                          Create a new account using an email address
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium">Check for confirmation email</h3>
                        <p className="text-sm text-gray-500">
                          Verify that you receive a confirmation email
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium">Click the confirmation link</h3>
                        <p className="text-sm text-gray-500">
                          Confirm your email and verify you can access the dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">GitHub Authentication</h3>
                  <p className="text-sm text-gray-500 mb-4">Test GitHub OAuth login</p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium">Click "Continue with GitHub"</h3>
                        <p className="text-sm text-gray-500">
                          Attempt to sign in with your GitHub account
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium">Authorize the application</h3>
                        <p className="text-sm text-gray-500">
                          Grant permission to your GitHub account
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium">Verify successful login</h3>
                        <p className="text-sm text-gray-500">
                          Confirm you are redirected to the dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-amber-50 border-amber-200">
                  <h3 className="flex items-center text-lg font-medium text-amber-800 mb-2">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Troubleshooting
                  </h3>
                  <p className="text-amber-700 mb-4">
                    If you encounter issues with authentication, check these common problems:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-amber-700">
                    <li>Verify that Site URL is correctly set</li>
                    <li>Ensure all redirect URLs are properly configured</li>
                    <li>Check that GitHub credentials match exactly</li>
                    <li>Verify the GitHub callback URL is correct</li>
                    <li>Check browser console for any errors</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button asChild className="w-full">
                <a href="/signup">Test Email Signup</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/login">Test GitHub Login</a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
