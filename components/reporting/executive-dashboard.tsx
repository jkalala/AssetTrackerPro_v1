'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Package, 
  Users, 
  Activity,
  RefreshCw,
  Download,
  Settings,
  Lightbulb,
  Target,
  AlertCircle,
  Info
} from 'lucide-react'
import { 
  ExecutiveDashboard as ExecutiveDashboardType, 
  ExecutiveInsight, 
  ExecutiveKPI, 
  ExecutiveTrend, 
  ExecutiveAlert 
} from '@/lib/types/reporting'

interface ExecutiveDashboardProps {
  dashboard: ExecutiveDashboardType
  onRefresh: () => void
  onExport: (format: 'pdf' | 'excel') => void
  onConfigure: () => void
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function ExecutiveDashboard({ dashboard, onRefresh, onExport, onConfigure }: ExecutiveDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setLastRefresh(new Date())
    setIsRefreshing(false)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-4 w-4" />
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4" />
      case 'recommendation':
        return <Lightbulb className="h-4 w-4" />
      case 'alert':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'text-red-600 bg-red-50 border-red-200'
    if (priority === 'high') return 'text-orange-600 bg-orange-50 border-orange-200'
    if (priority === 'medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatKPIValue = (value: number, unit: string) => {
    if (unit === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    }
    
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`
    }
    
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-600 mt-1">{dashboard.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleString()}
            </span>
            <Badge variant="outline">
              Auto-refresh: {dashboard.refresh_interval}s
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onConfigure}>
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboard.kpis.map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.name}</p>
                      <p className="text-2xl font-bold">
                        {formatKPIValue(kpi.value, kpi.unit)}
                      </p>
                      {kpi.target && (
                        <p className="text-xs text-gray-500">
                          Target: {formatKPIValue(kpi.target, kpi.unit)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      {getTrendIcon(kpi.trend)}
                      <span className={`text-sm font-medium ${
                        kpi.change_percent > 0 ? 'text-green-600' : 
                        kpi.change_percent < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {kpi.change_percent > 0 ? '+' : ''}{kpi.change_percent.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">{kpi.period}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard.trends.slice(0, 2).map((trend, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{trend.name}</span>
                    {getTrendIcon(trend.trend_direction)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trend.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [formatKPIValue(value, 'number'), trend.name]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={COLORS[index % COLORS.length]} 
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.3}
                      />
                      {trend.forecast && (
                        <Area 
                          type="monotone" 
                          dataKey="forecast" 
                          stroke={COLORS[index % COLORS.length]} 
                          strokeDasharray="5 5"
                          fill="none"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.insights.slice(0, 3).map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${getInsightColor(insight.type, insight.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm mt-1">{insight.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(insight.generated_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard.insights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <span>{insight.title}</span>
                    </div>
                    <Badge 
                      variant={insight.priority === 'critical' ? 'destructive' : 'secondary'}
                    >
                      {insight.priority}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{insight.description}</p>
                  
                  {insight.data && Object.keys(insight.data).length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Details:</h5>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {Object.entries(insight.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-medium">
                              {typeof value === 'number' ? formatKPIValue(value, 'number') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Badge variant="outline">{insight.type}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(insight.generated_at).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <div className="space-y-6">
            {dashboard.trends.map((trend, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{trend.name}</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(trend.trend_direction)}
                      <Badge variant="outline">{trend.trend_direction}</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trend.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [formatKPIValue(value, 'number'), 'Value']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      {trend.forecast && trend.forecast.length > 0 && (
                        <Line 
                          type="monotone" 
                          dataKey="forecast" 
                          stroke={COLORS[index % COLORS.length]} 
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <div className="space-y-4">
            {dashboard.alerts.map((alert, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              alert.severity === 'critical' ? 'destructive' : 
                              alert.severity === 'error' ? 'destructive' :
                              alert.severity === 'warning' ? 'secondary' : 'outline'
                            }
                          >
                            {alert.severity}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="outline" className="text-xs">
                          {alert.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {dashboard.alerts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All Clear</h3>
                  <p className="text-gray-600">No active alerts at this time.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}