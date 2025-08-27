'use client'

// =====================================================
// DASHBOARD COMPONENT
// =====================================================
// Main dashboard component with real-time updates and editing

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Settings, 
  RefreshCw, 
  Share, 
  Download,
  Edit,
  Save,
  X,
  AlertTriangle,
  Clock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dashboard as DashboardType, Widget } from '@/lib/types/analytics'
import { DashboardWidget } from './dashboard-widget'
import { DashboardService } from '@/lib/services/dashboard-service'

interface DashboardProps {
  dashboard: DashboardType
  tenantId: string
  userId: string
  onDashboardUpdate?: (dashboard: DashboardType) => void
  onWidgetAdd?: () => void
  onWidgetEdit?: (widget: Widget) => void
  className?: string
}

export function Dashboard({
  dashboard,
  tenantId,
  userId: _userId,
  onDashboardUpdate,
  onWidgetAdd,
  onWidgetEdit,
  className = ''
}: DashboardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>(dashboard.widgets)

  const dashboardService = new DashboardService()

  useEffect(() => {
    setWidgets(dashboard.widgets)
    setLastUpdated(dashboard.updated_at)
  }, [dashboard])

  // Auto-refresh based on dashboard refresh interval
  useEffect(() => {
    if (dashboard.refresh_interval === 'none') return

    const intervalMs = getRefreshIntervalMs(dashboard.refresh_interval)
    if (intervalMs === 0) return

    const interval = setInterval(() => {
      handleRefreshAll()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [dashboard.refresh_interval])

  const getRefreshIntervalMs = (interval: string): number => {
    switch (interval) {
      case '30s': return 30 * 1000
      case '1m': return 60 * 1000
      case '5m': return 5 * 60 * 1000
      case '15m': return 15 * 60 * 1000
      case '30m': return 30 * 60 * 1000
      case '1h': return 60 * 60 * 1000
      default: return 0
    }
  }

  const handleRefreshAll = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    setError(null)

    try {
      const updatedDashboard = await dashboardService.getDashboard(dashboard.id, tenantId)
      if (updatedDashboard) {
        setWidgets(updatedDashboard.widgets)
        setLastUpdated(new Date().toISOString())
        onDashboardUpdate?.(updatedDashboard)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh dashboard')
    } finally {
      setIsRefreshing(false)
    }
  }, [dashboard.id, tenantId, isRefreshing, dashboardService, onDashboardUpdate])

  const handleRefreshWidget = async (widgetId: string) => {
    try {
      const widgetData = await dashboardService.refreshWidget(widgetId, dashboard.id, tenantId)
      
      setWidgets(prev => prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, data: widgetData, last_updated: new Date().toISOString() }
          : widget
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh widget')
    }
  }

  const handleWidgetDelete = async (widgetId: string) => {
    try {
      const updatedWidgets = widgets.filter(w => w.id !== widgetId)
      
      await dashboardService.updateDashboard(dashboard.id, {
        widgets: updatedWidgets
      })

      setWidgets(updatedWidgets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete widget')
    }
  }

  const handleSaveLayout = async () => {
    try {
      const updatedDashboard = await dashboardService.updateDashboard(dashboard.id, {
        widgets: widgets
      })

      setIsEditing(false)
      onDashboardUpdate?.(updatedDashboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout')
    }
  }

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getGridStyle = () => {
    const { layout } = dashboard
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
      gap: `${layout.gap}px`,
      minHeight: `${layout.rows * 60}px`,
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-gray-600">{dashboard.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {dashboard.refresh_interval !== 'none' && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{dashboard.refresh_interval}</span>
              </Badge>
            )}
            
            {dashboard.is_public && (
              <Badge variant="secondary">Public</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveLayout}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onWidgetAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Widget
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="h-4 w-4 mr-2" />
                    Share Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Grid */}
      <div style={getGridStyle()}>
        {widgets.map((widget) => (
          <div
            key={widget.id}
            style={{
              gridColumn: `${widget.position.x + 1} / span ${widget.size.width}`,
              gridRow: `${widget.position.y + 1} / span ${widget.size.height}`,
            }}
          >
            <DashboardWidget
              widget={widget}
              onRefresh={handleRefreshWidget}
              onEdit={onWidgetEdit}
              onDelete={isEditing ? handleWidgetDelete : undefined}
              isEditing={isEditing}
            />
          </div>
        ))}

        {/* Add Widget Placeholder */}
        {isEditing && (
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-center h-full">
              <Button
                variant="ghost"
                onClick={onWidgetAdd}
                className="h-full w-full flex flex-col items-center space-y-2"
              >
                <Plus className="h-8 w-8 text-gray-400" />
                <span className="text-gray-600">Add Widget</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {widgets.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No widgets configured
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first widget to start building your dashboard
                </p>
                <Button onClick={onWidgetAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}