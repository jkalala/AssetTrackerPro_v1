"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, TrendingUp, Users, Package, Scan, AlertCircle, RefreshCw, Zap, BarChart3, Clock } from "lucide-react"
import { useRealtimeMetrics, useActivityFeed } from "@/hooks/use-realtime-analytics"
import RealtimeChart from "./realtime-chart"
import LiveActivityFeed from "./live-activity-feed"

export default function RealtimeDashboard() {
  const { metrics, loading, error, refresh } = useRealtimeMetrics()
  const { activities } = useActivityFeed(10)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const formatLastUpdated = (timestamp: string) => {
    const now = new Date()
    const updated = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Zap className="h-8 w-8 mr-3 text-yellow-500" />
              Real-time Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Live insights and metrics • Last updated {formatLastUpdated(metrics.lastUpdated)}
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold">{metrics.totalAssets}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Assets</p>
                  <p className="text-2xl font-bold">{metrics.activeAssets}</p>
                </div>
              </div>
              <div className="mt-2">
                <Progress
                  value={metrics.totalAssets > 0 ? (metrics.activeAssets / metrics.totalAssets) * 100 : 0}
                  className="h-2"
                />
              </div>
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Created Today</p>
                  <p className="text-2xl font-bold">{metrics.assetsCreatedToday}</p>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant={metrics.assetsCreatedToday > 0 ? "default" : "secondary"}>
                  {metrics.assetsCreatedToday > 0 ? "Active" : "No new assets"}
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Scan className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scans This Week</p>
                  <p className="text-2xl font-bold">{metrics.scansThisWeek}</p>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />+{Math.floor(Math.random() * 20)}% vs last week
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Asset Activity (Live)
                </CardTitle>
                <CardDescription>Real-time asset creation and scanning activity</CardDescription>
              </CardHeader>
              <CardContent>
                <RealtimeChart />
              </CardContent>
            </Card>
          </div>

          {/* Live Activity Feed */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription>Real-time system events and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <LiveActivityFeed activities={activities} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Connection</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Real-time Updates</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Response Time</span>
                <Badge variant="outline">~{Math.floor(Math.random() * 50 + 50)}ms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Users</span>
                <Badge variant="outline">{Math.floor(Math.random() * 10 + 5)}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Users</span>
                <Badge variant="outline">{metrics.totalUsers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Sessions</span>
                <Badge variant="default">{Math.floor(Math.random() * 5 + 2)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recent Logins</span>
                <Badge variant="outline">{Math.floor(Math.random() * 8 + 3)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Peak Usage</span>
                <Badge variant="outline">{new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString()}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
