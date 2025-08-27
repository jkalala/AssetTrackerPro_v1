// =====================================================
// DASHBOARDS PAGE
// =====================================================
// Main page for viewing and managing analytics dashboards

import { Suspense } from 'react'
import { DashboardList } from '@/components/analytics/dashboard-list'
import { Button } from '@/components/ui/button'
import { Plus, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboards</h1>
          <p className="text-gray-600 mt-2">
            Create and manage real-time dashboards with customizable widgets and KPIs
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link href="/analytics/dashboards/templates">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Browse Templates
            </Button>
          </Link>
          
          <Link href="/analytics/dashboards/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard List */}
      <Suspense fallback={<DashboardListSkeleton />}>
        <DashboardList />
      </Suspense>
    </div>
  )
}

export function DashboardListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  )
}