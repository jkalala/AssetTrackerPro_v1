import type { Metadata } from 'next'
import { SUPABASE_CONFIG } from '@/lib/supabase/config'
import { SupabaseConnectionTest } from '@/components/supabase-connection-test'

export const metadata: Metadata = {
  title: 'Supabase Connection Test',
  description: 'Verify your Supabase connection is working correctly',
}

export default function SupabaseTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
      <p className="text-muted-foreground mb-8">
        This page tests your connection to the Supabase project and verifies your API keys are
        working correctly.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <SupabaseConnectionTest />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Connection Details</h2>
          <div className="space-y-2">
            <p className="font-medium">Project ID</p>
            <p className="text-sm text-muted-foreground">{SUPABASE_CONFIG.projectId}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Project URL</p>
            <p className="text-sm text-muted-foreground">{SUPABASE_CONFIG.url}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Environment</p>
            <p className="text-sm text-muted-foreground">
              {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
            </p>
          </div>

          <div className="mt-6">
            <a href="/docs/supabase-setup" className="text-primary hover:underline font-medium">
              View Supabase Setup Guide →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
