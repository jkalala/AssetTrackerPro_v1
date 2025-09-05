import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()

  try {
    // Get user for authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date and calculate date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch comprehensive analytics data
    const [
      totalAssets,
      activeAssets,
      assetsCreatedToday,
      assetsCreatedThisWeek,
      assetsCreatedThisMonth,
      assetsByCategory,
      assetsByStatus,
      recentActivity,
      qrCodeStats,
      userActivity,
      locationStats,
      valueStats,
    ] = await Promise.all([
      // Total assets
      supabase.from('assets').select('id', { count: 'exact' }),

      // Active assets
      supabase.from('assets').select('id', { count: 'exact' }).eq('status', 'active'),

      // Assets created today
      supabase
        .from('assets')
        .select('id', { count: 'exact' })
        .gte('created_at', today.toISOString()),

      // Assets created this week
      supabase
        .from('assets')
        .select('id', { count: 'exact' })
        .gte('created_at', weekAgo.toISOString()),

      // Assets created this month
      supabase
        .from('assets')
        .select('id', { count: 'exact' })
        .gte('created_at', monthAgo.toISOString()),

      // Assets by category
      supabase.from('assets').select('category, id').not('category', 'is', null),

      // Assets by status
      supabase.from('assets').select('status, id'),

      // Recent activity (last 50 activities)
      supabase
        .from('assets')
        .select('id, name, created_at, updated_at, status')
        .order('updated_at', { ascending: false })
        .limit(50),

      // QR code statistics
      supabase.from('assets').select('id, qr_code').not('qr_code', 'is', null),

      // User activity (profiles)
      supabase.from('profiles').select('id, full_name, created_at, last_sign_in_at'),

      // Location statistics
      supabase.from('assets').select('location').not('location', 'is', null),

      // Value statistics
      supabase.from('assets').select('purchase_value').not('purchase_value', 'is', null),
    ])

    // Process category data
    const categoryCounts: { [key: string]: number } = {}
    if (assetsByCategory.data) {
      assetsByCategory.data.forEach(asset => {
        if (asset.category) {
          categoryCounts[asset.category] = (categoryCounts[asset.category] || 0) + 1
        }
      })
    }

    // Process status data
    const statusCounts: { [key: string]: number } = {}
    if (assetsByStatus.data) {
      assetsByStatus.data.forEach(asset => {
        if (asset.status) {
          statusCounts[asset.status] = (statusCounts[asset.status] || 0) + 1
        }
      })
    }

    // Process location data
    const locationCounts: { [key: string]: number } = {}
    if (locationStats.data) {
      locationStats.data.forEach(asset => {
        if (asset.location) {
          locationCounts[asset.location] = (locationCounts[asset.location] || 0) + 1
        }
      })
    }

    // Calculate total value
    const totalValue =
      valueStats.data?.reduce((sum, asset) => {
        return sum + (asset.purchase_value || 0)
      }, 0) || 0

    // Calculate QR code coverage
    const qrCoverage =
      totalAssets.count && qrCodeStats.data
        ? Math.round((qrCodeStats.data.length / totalAssets.count) * 100)
        : 0

    // Generate time series data for charts
    const timeSeriesData = generateTimeSeriesData(assetsCreatedThisWeek.count || 0)

    // Generate mock scan data (in real implementation, this would come from scan logs)
    const scanData = generateMockScanData()

    const analytics = {
      overview: {
        totalAssets: totalAssets.count || 0,
        activeAssets: activeAssets.count || 0,
        assetsCreatedToday: assetsCreatedToday.count || 0,
        assetsCreatedThisWeek: assetsCreatedThisWeek.count || 0,
        assetsCreatedThisMonth: assetsCreatedThisMonth.count || 0,
        totalValue: totalValue,
        qrCoverage: qrCoverage,
        lastUpdated: now.toISOString(),
      },
      categories: Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        percentage: totalAssets.count ? Math.round((count / totalAssets.count) * 100) : 0,
      })),
      status: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: totalAssets.count ? Math.round((count / totalAssets.count) * 100) : 0,
      })),
      locations: Object.entries(locationCounts).map(([location, count]) => ({
        location,
        count,
        percentage: totalAssets.count ? Math.round((count / totalAssets.count) * 100) : 0,
      })),
      timeSeries: timeSeriesData,
      scanData: scanData,
      recentActivity: recentActivity.data || [],
      userActivity: {
        totalUsers: userActivity.data?.length || 0,
        activeUsers: userActivity.data?.filter(u => u.last_sign_in_at).length || 0,
        newUsersThisMonth:
          userActivity.data?.filter(u => new Date(u.created_at) >= monthAgo).length || 0,
      },
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
  }
}

function generateTimeSeriesData(weeklyAssets: number) {
  const data = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayAssets = Math.floor(Math.random() * Math.max(1, weeklyAssets / 7))
    const dayScans = Math.floor(Math.random() * 50) + 10

    data.push({
      date: date.toISOString().split('T')[0],
      assets: dayAssets,
      scans: dayScans,
      users: Math.floor(Math.random() * 20) + 5,
    })
  }

  return data
}

function generateMockScanData() {
  const data = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
    const scans = Math.floor(Math.random() * 20) + 5

    data.push({
      hour: hour.getHours(),
      scans: scans,
      timestamp: hour.toISOString(),
    })
  }

  return data
}
