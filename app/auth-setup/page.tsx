import { SupabaseDashboardGuide } from "@/components/supabase-dashboard-guide"

export const metadata = {
  title: "Authentication Setup Guide",
  description: "Configure email confirmations and GitHub OAuth for your application",
}

export default function AuthSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <SupabaseDashboardGuide />
    </div>
  )
}
