'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, CheckCircle, Settings, Github } from 'lucide-react'
import Link from 'next/link'

export default function GitHubOAuthSetupPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">GitHub OAuth Configuration</h1>
        <p className="text-gray-600 text-lg">
          Complete setup guide for configuring GitHub OAuth authentication with Supabase
        </p>
      </div>

      {/* Current Configuration */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Configuration
          </CardTitle>
          <CardDescription>Your GitHub OAuth application credentials and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client ID</label>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                  Ov23lipMb8831rUNvsJR
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('Ov23lipMb8831rUNvsJR')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Secret</label>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                  97c8805c06fa9b6589b8d33848a0835873fd2f98
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('97c8805c06fa9b6589b8d33848a0835873fd2f98')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Production URL</label>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                https://cloudeleavepro.vercel.app
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard('https://cloudeleavepro.vercel.app')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-step Setup */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Setup Instructions</h2>

        {/* Step 1: Supabase Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              Configure Supabase Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Go to your{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Supabase Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                Navigate to <strong>Authentication → Providers</strong>
              </li>
              <li>
                Find <strong>GitHub</strong> in the list and click to configure
              </li>
              <li>Enable the GitHub provider</li>
              <li>
                Enter the Client ID:
                <div className="mt-1 flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded">Ov23lipMb8831rUNvsJR</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard('Ov23lipMb8831rUNvsJR')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </li>
              <li>
                Enter the Client Secret:
                <div className="mt-1 flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    97c8805c06fa9b6589b8d33848a0835873fd2f98
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard('97c8805c06fa9b6589b8d33848a0835873fd2f98')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </li>
              <li>
                Set the Redirect URL to:
                <div className="mt-1 flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    https://cloudeleavepro.vercel.app/auth/callback
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard('https://cloudeleavepro.vercel.app/auth/callback')
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </li>
              <li>
                Click <strong>Save</strong>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 2: GitHub OAuth App Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              Update GitHub OAuth App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Go to{' '}
                <a
                  href="https://github.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  GitHub Developer Settings <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                Click on <strong>OAuth Apps</strong>
              </li>
              <li>Find your OAuth app or create a new one</li>
              <li>
                Set the <strong>Homepage URL</strong> to:
                <div className="mt-1 flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    https://cloudeleavepro.vercel.app
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard('https://cloudeleavepro.vercel.app')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </li>
              <li>
                Set the <strong>Authorization callback URL</strong> to:
                <div className="mt-1 flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    https://cloudeleavepro.vercel.app/auth/callback
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard('https://cloudeleavepro.vercel.app/auth/callback')
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </li>
              <li>
                Click <strong>Update application</strong>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 3: Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">3</Badge>
              Verify Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Ensure these environment variables are set in your Vercel deployment:
            </p>
            <div className="space-y-3">
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm block">
                  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
                </code>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm block">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
                </code>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm block">
                  NEXT_PUBLIC_APP_URL=https://cloudeleavepro.vercel.app
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">4</Badge>
              Test the Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Deploy your changes to Vercel</li>
              <li>
                Visit <code>https://cloudeleavepro.vercel.app/login</code>
              </li>
              <li>Click "Continue with GitHub"</li>
              <li>Complete the GitHub authorization</li>
              <li>Verify you're redirected to the dashboard</li>
            </ol>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Success indicators:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>GitHub OAuth popup opens without errors</li>
                  <li>User is redirected to dashboard after authorization</li>
                  <li>User profile is created in Supabase</li>
                  <li>No console errors in browser</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline">
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Supabase Dashboard
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub OAuth Apps
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Test Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
