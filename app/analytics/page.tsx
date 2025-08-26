"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Users, 
  Download, 
  Filter, 
  Calendar, 
  Zap, 
  RefreshCw,
  AlertCircle,
  FileText
} from "lucide-react"
import { useAnalytics } from "@/hooks/use-analytics"
import { useAnalyticsExport } from "@/hooks/use-analytics-export"
import { useToast } from "@/hooks/use-toast"
import { 
  AnalyticsSummaryCards,
  CategoryDistributionChart,
  StatusDistributionChart,
  LocationDistributionChart,
  TimeSeriesChart,
  ScanActivityChart
} from "@/components/analytics-charts"
import {
  AssetValueReport,
  AssetStatusReport,
  LocationReport,
  UserActivityReport
} from "@/components/analytics-reports"

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const { data, loading, error, refresh } = useAnalytics()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { exportAll, exporting } = useAnalyticsExport()
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExportAll = async () => {
    try {
      const result = await exportAll('json')
      if (result.success) {
        toast({
          title: "Export Successful",
          description: "All analytics data exported as JSON",
        })
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to export data",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Export Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load analytics data: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No analytics data available. Please add some assets to see analytics.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
                Analytics & Reporting
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights and detailed reports for your asset management system
                {data.overview.lastUpdated && (
                  <span className="ml-2 text-sm text-gray-500">
                    • Last updated {formatLastUpdated(data.overview.lastUpdated)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={handleExportAll} disabled={exporting} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <AnalyticsSummaryCards overview={data.overview} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimeSeriesChart data={data.timeSeries} />
                <ScanActivityChart data={data.scanData} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CategoryDistributionChart data={data.categories} />
                <StatusDistributionChart data={data.status} />
                <LocationDistributionChart data={data.locations} />
              </div>
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimeSeriesChart data={data.timeSeries} />
                <ScanActivityChart data={data.scanData} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CategoryDistributionChart data={data.categories} />
                <StatusDistributionChart data={data.status} />
                <LocationDistributionChart data={data.locations} />
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              <AssetValueReport data={data} />
              <AssetStatusReport data={data} />
              <LocationReport data={data} />
              <UserActivityReport data={data} />
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Growth Trends
                  </CardTitle>
                  <CardDescription>Asset growth and activity trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <TimeSeriesChart data={data.timeSeries} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        +{data.overview.assetsCreatedThisWeek}
                      </div>
                      <div className="text-sm text-gray-600">Assets This Week</div>
                      <Badge variant="outline" className="mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Growing
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        +{data.overview.assetsCreatedThisMonth}
                      </div>
                      <div className="text-sm text-gray-600">Assets This Month</div>
                      <Badge variant="outline" className="mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Steady Growth
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {data.userActivity.newUsersThisMonth}
                      </div>
                      <div className="text-sm text-gray-600">New Users This Month</div>
                      <Badge variant="outline" className="mt-2">
                        <Users className="h-3 w-3 mr-1" />
                        Expanding
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest asset updates and system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.recentActivity.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <div className="font-medium">{activity.name}</div>
                            <div className="text-sm text-gray-500">
                              Updated {new Date(activity.updated_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ScanActivityChart data={data.scanData} />
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-6">
              <UserActivityReport data={data} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{data.userActivity.totalUsers}</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {data.userActivity.activeUsers}
                      </div>
                      <div className="text-sm text-gray-600">Active Users</div>
                      <Badge variant="default" className="mt-2">
                        {data.userActivity.totalUsers > 0 ? Math.round((data.userActivity.activeUsers / data.userActivity.totalUsers) * 100) : 0}% active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {data.userActivity.newUsersThisMonth}
                      </div>
                      <div className="text-sm text-gray-600">New This Month</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
