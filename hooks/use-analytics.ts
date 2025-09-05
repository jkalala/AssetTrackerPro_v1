import { useState, useEffect } from 'react'

export interface AnalyticsData {
  overview: {
    totalAssets: number
    activeAssets: number
    assetsCreatedToday: number
    assetsCreatedThisWeek: number
    assetsCreatedThisMonth: number
    totalValue: number
    qrCoverage: number
    lastUpdated: string
  }
  categories: Array<{
    category: string
    count: number
    percentage: number
  }>
  status: Array<{
    status: string
    count: number
    percentage: number
  }>
  locations: Array<{
    location: string
    count: number
    percentage: number
  }>
  timeSeries: Array<{
    date: string
    assets: number
    scans: number
    users: number
  }>
  scanData: Array<{
    hour: number
    scans: number
    timestamp: string
  }>
  recentActivity: Array<{
    id: string
    name: string
    created_at: string
    updated_at: string
    status: string
  }>
  userActivity: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
  }
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      setData(result.analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const refresh = () => {
    fetchAnalytics()
  }

  return {
    data,
    loading,
    error,
    refresh,
  }
}

export function useAnalyticsWithInterval(intervalMs: number = 30000) {
  const analytics = useAnalytics()

  useEffect(() => {
    const interval = setInterval(() => {
      analytics.refresh()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs, analytics.refresh])

  return analytics
}
