'use client'

// =====================================================
// DASHBOARD WIDGET COMPONENT
// =====================================================
// Reusable widget component for dashboard displays

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Widget } from '@/lib/types/analytics'
import { MetricWidget } from './widgets/metric-widget'
import { ChartWidget } from './widgets/chart-widget'
import { TableWidget } from './widgets/table-widget'
import { MapWidget } from './widgets/map-widget'

interface DashboardWidgetProps {
  widget: Widget
  onRefresh?: (widgetId: string) => void
  onEdit?: (widget: Widget) => void
  onDelete?: (widgetId: string) => void
  onResize?: (widgetId: string, size: { width: number; height: number }) => void
  isEditing?: boolean
  className?: string
}

export function DashboardWidget({
  widget,
  onRefresh,
  onEdit,
  onDelete,
  onResize,
  isEditing = false,
  className = ''
}: DashboardWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>()

  useEffect(() => {
    if (widget.last_updated) {
      setLastUpdated(widget.last_updated)
    }
  }, [widget.last_updated])

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh(widget.id)
      setLastUpdated(new Date().toISOString())
    } finally {
      setIsRefreshing(false)
    }
  }

  const renderWidgetContent = () => {
    if (widget.loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading...</span>
        </div>
      )
    }

    if (widget.error) {
      return (
        <div className="flex items-center justify-center h-32 text-red-500">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <span>Error: {widget.error}</span>
        </div>
      )
    }

    if (!widget.data) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <span>No data available</span>
        </div>
      )
    }

    switch (widget.type) {
      case 'metric':
        return <MetricWidget widget={widget} data={widget.data} />
      
      case 'chart':
        return <ChartWidget widget={widget} data={widget.data} />
      
      case 'table':
        return <TableWidget widget={widget} data={widget.data} />
      
      case 'map':
        return <MapWidget widget={widget} data={widget.data} />
      
      case 'gauge':
        return <MetricWidget widget={widget} data={widget.data} variant="gauge" />
      
      case 'progress':
        return <MetricWidget widget={widget} data={widget.data} variant="progress" />
      
      default:
        return (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <span>Unsupported widget type: {widget.type}</span>
          </div>
        )
    }
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />
      default:
        return null
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

  return (
    <Card 
      className={`relative transition-all duration-200 hover:shadow-md ${
        isEditing ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      } ${className}`}
      style={{
        width: `${widget.size.width * 100}px`,
        height: `${widget.size.height * 60}px`,
        minWidth: widget.size.min_width ? `${widget.size.min_width}px` : undefined,
        minHeight: widget.size.min_height ? `${widget.size.min_height}px` : undefined,
        maxWidth: widget.size.max_width ? `${widget.size.max_width}px` : undefined,
        maxHeight: widget.size.max_height ? `${widget.size.max_height}px` : undefined,
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium">
            {widget.title}
          </CardTitle>
          {widget.data?.metadata?.trend ? (
            <span>{getTrendIcon(String(widget.data.metadata.trend) as 'up' | 'down' | 'stable')}</span>
          ) : null}
        </div>
        
        <div className="flex items-center space-x-1">
          {widget.refresh_interval && widget.refresh_interval !== 'none' && (
            <Badge variant="outline" className="text-xs">
              {widget.refresh_interval}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(widget)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Widget
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(widget.id)}
                    className="text-red-600"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Widget
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {widget.description && (
          <p className="text-xs text-gray-600 mb-3">{widget.description}</p>
        )}
        
        {renderWidgetContent()}
        
        {lastUpdated && (
          <div className="mt-2 text-xs text-gray-500 text-right">
            Updated {formatLastUpdated(lastUpdated)}
          </div>
        )}
      </CardContent>
      
      {isEditing && onResize && (
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize opacity-50 hover:opacity-100" />
      )}
    </Card>
  )
}