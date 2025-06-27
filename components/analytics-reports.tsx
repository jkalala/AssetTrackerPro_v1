"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  BarChart3,
  DollarSign,
  Package,
  Users,
  Activity,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useAnalyticsExport } from "@/hooks/use-analytics-export"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsReportsProps {
  data: {
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
    categories: Array<{ category: string; count: number; percentage: number }>
    status: Array<{ status: string; count: number; percentage: number }>
    locations: Array<{ location: string; count: number; percentage: number }>
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
}

export function AssetValueReport({ data }: AnalyticsReportsProps) {
  const { exportOverview, exportCategories, exporting } = useAnalyticsExport()
  const { toast } = useToast()
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('json')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const averageValue = data.overview.totalAssets > 0 
    ? data.overview.totalValue / data.overview.totalAssets 
    : 0

  const handleExport = async (type: 'overview' | 'categories') => {
    try {
      const result = type === 'overview' 
        ? await exportOverview(exportFormat)
        : await exportCategories(exportFormat)
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: `${type} data exported as ${exportFormat.toUpperCase()}`,
        })
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to export data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Asset Value Report
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <Button 
              onClick={() => handleExport('overview')} 
              disabled={exporting}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Overview
            </Button>
            <Button 
              onClick={() => handleExport('categories')} 
              disabled={exporting}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Categories
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Comprehensive financial overview of your asset portfolio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.overview.totalValue)}
            </div>
            <div className="text-sm text-gray-600">Total Portfolio Value</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(averageValue)}
            </div>
            <div className="text-sm text-gray-600">Average Asset Value</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {data.overview.totalAssets}
            </div>
            <div className="text-sm text-gray-600">Total Assets</div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Value Distribution by Category</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Estimated Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.categories.map((category) => {
                const estimatedValue = (category.percentage / 100) * data.overview.totalValue
                return (
                  <TableRow key={category.category}>
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell>{category.count}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{category.percentage}%</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(estimatedValue)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export function AssetStatusReport({ data }: AnalyticsReportsProps) {
  const { exportStatus, exporting } = useAnalyticsExport()
  const { toast } = useToast()
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('json')

  const handleExport = async () => {
    try {
      const result = await exportStatus(exportFormat)
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: `Status data exported as ${exportFormat.toUpperCase()}`,
        })
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to export data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Asset Status Report
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Detailed breakdown of asset status and health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.overview.activeAssets}
            </div>
            <div className="text-sm text-gray-600">Active Assets</div>
            <Badge variant="default" className="mt-2">
              {data.overview.totalAssets > 0 ? Math.round((data.overview.activeAssets / data.overview.totalAssets) * 100) : 0}%
            </Badge>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {data.overview.totalAssets - data.overview.activeAssets}
            </div>
            <div className="text-sm text-gray-600">Inactive Assets</div>
            <Badge variant="secondary" className="mt-2">
              {data.overview.totalAssets > 0 ? Math.round(((data.overview.totalAssets - data.overview.activeAssets) / data.overview.totalAssets) * 100) : 0}%
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Status Breakdown</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.status.map((status) => (
                <TableRow key={status.status}>
                  <TableCell className="font-medium">{status.status}</TableCell>
                  <TableCell>{status.count}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{status.percentage}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={status.status === 'active' ? 'default' : 'secondary'}
                    >
                      {status.status === 'active' ? 'Healthy' : 'Needs Attention'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export function LocationReport({ data }: AnalyticsReportsProps) {
  const { exportLocations, exporting } = useAnalyticsExport()
  const { toast } = useToast()
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('json')

  const handleExport = async () => {
    try {
      const result = await exportLocations(exportFormat)
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: `Location data exported as ${exportFormat.toUpperCase()}`,
        })
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to export data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Location Distribution Report
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Asset distribution across different locations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Assets by Location</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Asset Count</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Density</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.locations.map((location) => (
                <TableRow key={location.location}>
                  <TableCell className="font-medium">{location.location}</TableCell>
                  <TableCell>{location.count}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{location.percentage}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={location.percentage > 20 ? 'default' : 'secondary'}
                    >
                      {location.percentage > 20 ? 'High' : location.percentage > 10 ? 'Medium' : 'Low'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {data.locations.length}
            </div>
            <div className="text-sm text-gray-600">Total Locations</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.max(...data.locations.map(l => l.count))}
            </div>
            <div className="text-sm text-gray-600">Most Populated</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(data.locations.reduce((sum, l) => sum + l.count, 0) / data.locations.length)}
            </div>
            <div className="text-sm text-gray-600">Average per Location</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function UserActivityReport({ data }: AnalyticsReportsProps) {
  const { exportUsers, exportActivity, exporting } = useAnalyticsExport()
  const { toast } = useToast()
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('json')

  const handleExport = async (type: 'users' | 'activity') => {
    try {
      const result = type === 'users' 
        ? await exportUsers(exportFormat)
        : await exportActivity(exportFormat)
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: `${type} data exported as ${exportFormat.toUpperCase()}`,
        })
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to export data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Activity Report
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <Button 
              onClick={() => handleExport('users')} 
              disabled={exporting}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
            <Button 
              onClick={() => handleExport('activity')} 
              disabled={exporting}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Activity
            </Button>
          </div>
        </CardTitle>
        <CardDescription>User engagement and system usage analytics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {data.userActivity.totalUsers}
            </div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.userActivity.activeUsers}
            </div>
            <div className="text-sm text-gray-600">Active Users</div>
            <Badge variant="default" className="mt-2">
              {data.userActivity.totalUsers > 0 ? Math.round((data.userActivity.activeUsers / data.userActivity.totalUsers) * 100) : 0}%
            </Badge>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {data.userActivity.newUsersThisMonth}
            </div>
            <div className="text-sm text-gray-600">New This Month</div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Recent Activity</h4>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentActivity.slice(0, 10).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell>
                      <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(activity.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 