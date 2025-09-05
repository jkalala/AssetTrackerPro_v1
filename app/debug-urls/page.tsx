import { UrlDebug } from '@/components/auth/url-debug'
import { SupabaseSetupGuide } from '@/components/supabase-setup-guide'

export default function DebugUrlsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fix Localhost Redirect Issue</h1>
          <p className="text-gray-600 mt-2">
            Complete setup guide to fix signup confirmation email redirects
          </p>
        </div>

        <SupabaseSetupGuide />

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Current URL Configuration</h2>
          <UrlDebug />
        </div>
      </div>
    </div>
  )
}
