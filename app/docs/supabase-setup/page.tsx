import type { Metadata } from "next"
import Link from "next/link"
import { SUPABASE_CONFIG } from "@/lib/supabase/config"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle2, Copy } from "lucide-react"

export const metadata: Metadata = {
  title: "Supabase Configuration Guide",
  description: "Complete guide for setting up Supabase with your application",
}

export default function SupabaseSetupPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Supabase Configuration Guide</h1>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Keep your API keys secure. Never commit them to public repositories or expose them in client-side code.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="vercel" className="mb-8">
        <TabsList>
          <TabsTrigger value="vercel">Vercel Setup</TabsTrigger>
          <TabsTrigger value="local">Local Development</TabsTrigger>
          <TabsTrigger value="testing">Testing Connection</TabsTrigger>
        </TabsList>

        <TabsContent value="vercel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vercel Environment Variables</CardTitle>
              <CardDescription>Configure these environment variables in your Vercel project settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">NEXT_PUBLIC_SUPABASE_URL</h3>
                  <div className="bg-muted px-3 py-1 rounded-md text-sm font-mono flex items-center gap-2">
                    {SUPABASE_CONFIG.url}
                    <Copy className="h-3.5 w-3.5 cursor-pointer opacity-70 hover:opacity-100" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Your Supabase project URL</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</h3>
                  <div className="bg-muted px-3 py-1 rounded-md text-sm font-mono flex items-center gap-2 overflow-x-auto max-w-[400px]">
                    {SUPABASE_CONFIG.anonKey}
                    <Copy className="h-3.5 w-3.5 shrink-0 cursor-pointer opacity-70 hover:opacity-100" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Your public anon key for client-side operations</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">SUPABASE_SERVICE_ROLE_KEY</h3>
                  <div className="bg-muted px-3 py-1 rounded-md text-sm font-mono flex items-center gap-2 overflow-x-auto max-w-[400px]">
                    <span className="text-red-500">
                      ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                    </span>
                    <Copy className="h-3.5 w-3.5 shrink-0 cursor-pointer opacity-70 hover:opacity-100" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your service role key for server-side operations (keep this secret)
                </p>
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    The service role key has admin privileges. Only use it in secure server environments and never
                    expose it to the client.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">NEXT_PUBLIC_APP_URL</h3>
                  <div className="bg-muted px-3 py-1 rounded-md text-sm font-mono flex items-center gap-2">
                    https://cloudeleavepro.vercel.app
                    <Copy className="h-3.5 w-3.5 cursor-pointer opacity-70 hover:opacity-100" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Your application URL for OAuth redirects</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vercel Deployment Steps</CardTitle>
              <CardDescription>Follow these steps to configure your Vercel project</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Go to your Vercel project dashboard</li>
                <li>
                  Navigate to <strong>Settings</strong> → <strong>Environment Variables</strong>
                </li>
                <li>Add each of the variables listed above</li>
                <li>
                  Make sure to set the correct <strong>Environment</strong> (Production, Preview, Development)
                </li>
                <li>
                  Click <strong>Save</strong> to apply the changes
                </li>
                <li>Redeploy your application to apply the new environment variables</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Local Development Setup</CardTitle>
              <CardDescription>Configure your local environment for development</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Create a <code>.env.local</code> file in your project root with the following variables:
              </p>

              <div className="bg-muted p-4 rounded-md font-mono text-sm mb-6 whitespace-pre overflow-x-auto">
                {`NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_CONFIG.url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Make sure to add <code>.env.local</code> to your <code>.gitignore</code> file to prevent committing
                  sensitive keys.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing Your Supabase Connection</CardTitle>
              <CardDescription>Verify that your Supabase configuration is working correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-medium">1. Authentication Test</h3>
              <p>Try logging in or signing up to verify authentication is working.</p>
              <div className="flex gap-4">
                <Link
                  href="/login"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Test Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Test Signup
                </Link>
              </div>

              <Separator className="my-4" />

              <h3 className="font-medium">2. Database Connection Test</h3>
              <p>Create a test asset to verify database operations are working.</p>
              <Link
                href="/add-asset"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium inline-block"
              >
                Create Test Asset
              </Link>

              <Separator className="my-4" />

              <h3 className="font-medium">3. Check Supabase Dashboard</h3>
              <p>Verify data is being stored correctly in your Supabase project.</p>
              <a
                href={SUPABASE_CONFIG.dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white hover:bg-black/90 px-4 py-2 rounded-md text-sm font-medium inline-block"
              >
                Open Supabase Dashboard
              </a>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
          <CardDescription>Follow these guidelines to keep your Supabase project secure</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Never expose your service role key in client-side code</li>
            <li>Set up proper Row Level Security (RLS) policies in Supabase</li>
            <li>Use the anon key for client-side operations only</li>
            <li>Implement proper authentication checks in your application</li>
            <li>Regularly rotate your API keys for enhanced security</li>
            <li>Use environment variables for all sensitive credentials</li>
            <li>Set up proper CORS configuration in your Supabase project</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
