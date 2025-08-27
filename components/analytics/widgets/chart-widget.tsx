'use client'

// =====================================================
// CHART WIDGET COMPONENT
// =====================================================
// Widget for displaying various chart types

import { Widget, WidgetData } from '@/lib/types/analytics'

interface ChartWidgetProps {
  widget: Widget
  data: WidgetData
}

export function ChartWidget({ widget, data }: ChartWidgetProps) {
  const { visualization } = widget
  
  // Default colors for charts
  const colors = visualization.colors || ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']

  const renderSimpleChart = () => {
    // Simple chart representation for now
    // In production, this would use a proper charting library
    const chartType = visualization.chart_type || 'bar'
    const labels = data.labels || []
    const datasets = data.datasets || []

    if (labels.length === 0 || datasets.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-lg mb-2">No chart data</div>
            <div className="text-sm">Data will appear when available</div>
          </div>
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col">
        <div className="text-sm text-gray-600 mb-2 capitalize">
          {chartType} Chart
        </div>
        <div className="flex-1 flex items-end space-x-2 p-4">
          {labels.slice(0, 8).map((label, index) => {
            const value = datasets[0]?.data[index] || 0
            const maxValue = Math.max(...(datasets[0]?.data?.filter((v): v is number => v !== null) || [0]))
            const height = maxValue > 0 ? (Number(value) / maxValue) * 100 : 0
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    backgroundColor: colors[index % colors.length],
                    minHeight: '4px'
                  }}
                />
                <div className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                  {String(label).substring(0, 8)}
                </div>
                <div className="text-xs font-medium">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              </div>
            )
          })}
        </div>
        {datasets.length > 1 && (
          <div className="mt-2 text-xs text-gray-500">
            Showing {datasets.length} data series
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      {renderSimpleChart()}
    </div>
  )
}