"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, Users, Package, DollarSign } from "lucide-react"

interface AnalyticsChartsProps {
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
    timeSeries: Array<{ date: string; assets: number; scans: number; users: number }>
    scanData: Array<{ hour: number; scans: number; timestamp: string }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function CategoryDistributionChart({ data }: { data: AnalyticsChartsProps['data']['categories'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Asset Categories
        </CardTitle>
        <CardDescription>Distribution of assets by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percentage }) => `${category} (${percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function StatusDistributionChart({ data }: { data: AnalyticsChartsProps['data']['status'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Asset Status
        </CardTitle>
        <CardDescription>Distribution of assets by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function LocationDistributionChart({ data }: { data: AnalyticsChartsProps['data']['locations'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Asset Locations
        </CardTitle>
        <CardDescription>Distribution of assets by location</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="location" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#82CA9D" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function TimeSeriesChart({ data }: { data: AnalyticsChartsProps['data']['timeSeries'] }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Activity Over Time
        </CardTitle>
        <CardDescription>Asset creation and scanning activity over the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={formatDate}
              formatter={(value: any, name: string) => [
                value, 
                name === 'assets' ? 'Assets Created' : 
                name === 'scans' ? 'QR Scans' : 'Active Users'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="assets" 
              stackId="1" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="scans" 
              stackId="1" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="users" 
              stackId="1" 
              stroke="#ffc658" 
              fill="#ffc658" 
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ScanActivityChart({ data }: { data: AnalyticsChartsProps['data']['scanData'] }) {
  const formatHour = (hour: number) => {
    return `${hour}:00`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          QR Scan Activity (24h)
        </CardTitle>
        <CardDescription>QR code scanning activity by hour</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={formatHour}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={formatHour}
              formatter={(value: any) => [value, 'Scans']}
            />
            <Line 
              type="monotone" 
              dataKey="scans" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function AnalyticsSummaryCards({ overview }: { overview: AnalyticsChartsProps['data']['overview'] }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold">{overview.totalAssets}</p>
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{overview.assetsCreatedThisWeek} this week
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Assets</p>
              <p className="text-2xl font-bold">{overview.activeAssets}</p>
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="default">
              {overview.totalAssets > 0 ? Math.round((overview.activeAssets / overview.totalAssets) * 100) : 0}% active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(overview.totalValue)}</p>
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              Average: {formatCurrency(overview.totalAssets > 0 ? overview.totalValue / overview.totalAssets : 0)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">QR Coverage</p>
              <p className="text-2xl font-bold">{overview.qrCoverage}%</p>
            </div>
          </div>
          <div className="mt-2">
            <Badge variant={overview.qrCoverage >= 80 ? "default" : "secondary"}>
              {overview.qrCoverage >= 80 ? "Excellent" : "Needs Improvement"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 