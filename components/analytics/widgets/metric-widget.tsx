'use client'

// =====================================================
// METRIC WIDGET COMPONENT
// =====================================================
// Widget for displaying single metrics, gauges, and progress bars

import { Widget, WidgetData } from '@/lib/types/analytics'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricWidgetProps {
  widget: Widget
  data: WidgetData
  variant?: 'default' | 'gauge' | 'progress'
}

export function MetricWidget({ widget, data, variant = 'default' }: MetricWidgetProps) {
  const metric = widget.visualization.metrics[0]
  const value = data.value as number
  const target = data.metadata?.target as number | undefined
  const trend = data.metadata?.trend as 'up' | 'down' | 'stable' | undefined
  const trendPercentage = data.metadata?.trend_percentage as number | undefined

  const formatValue = (val: number): string => {
    if (!metric) return val.toString()

    let formatted = val.toString()

    // Apply decimal places
    if (metric.decimal_places !== undefined) {
      formatted = val.toFixed(metric.decimal_places)
    }

    // Apply format
    switch (metric.format) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: metric.decimal_places || 0,
          maximumFractionDigits: metric.decimal_places || 0
        }).format(val)
        break
      
      case 'percentage':
        formatted = `${formatted}%`
        break
      
      case 'number':
        formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: metric.decimal_places || 0,
          maximumFractionDigits: metric.decimal_places || 0
        }).format(val)
        break
      
      case 'duration':
        // Convert to human readable duration (assuming value is in minutes)
        const hours = Math.floor(val / 60)
        const minutes = val % 60
        formatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        break
    }

    // Add prefix and suffix
    if (metric.prefix) formatted = `${metric.prefix}${formatted}`
    if (metric.suffix) formatted = `${formatted}${metric.suffix}`

    return formatted
  }

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />
      case 'down': return <TrendingDown className="h-4 w-4" />
      case 'stable': return <Minus className="h-4 w-4" />
      default: return null
    }
  }

  const getProgressPercentage = (): number => {
    if (!target || target === 0) return 0
    return Math.min((value / target) * 100, 100)
  }

  // const getProgressColor = (percentage: number): string => {
  //   if (percentage >= 90) return 'bg-green-500'
  //   if (percentage >= 70) return 'bg-yellow-500'
  //   if (percentage >= 50) return 'bg-orange-500'
  //   return 'bg-red-500'
  // }

  if (variant === 'gauge') {
    const percentage = getProgressPercentage()
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500'}
              style={{
                transition: 'stroke-dashoffset 0.5s ease-in-out',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold">{formatValue(value)}</div>
              {target && (
                <div className="text-xs text-gray-500">of {formatValue(target)}</div>
              )}
            </div>
          </div>
        </div>
        
        {trend && trendPercentage && (
          <div className={`flex items-center mt-2 text-sm ${getTrendColor(trend)}`}>
            {getTrendIcon(trend)}
            <span className="ml-1">{Math.abs(trendPercentage).toFixed(1)}%</span>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'progress') {
    const percentage = getProgressPercentage()
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{formatValue(value)}</div>
          {target && (
            <div className="text-sm text-gray-500">Target: {formatValue(target)}</div>
          )}
        </div>
        
        {target && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{percentage.toFixed(1)}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        )}
        
        {trend && trendPercentage && (
          <div className={`flex items-center justify-center text-sm ${getTrendColor(trend)}`}>
            {getTrendIcon(trend)}
            <span className="ml-1">{Math.abs(trendPercentage).toFixed(1)}% from last period</span>
          </div>
        )}
      </div>
    )
  }

  // Default metric display
  return (
    <div className="flex flex-col justify-center h-full">
      <div className="text-center">
        <div className="text-3xl font-bold mb-2">{formatValue(value)}</div>
        
        {metric?.label && (
          <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
        )}
        
        {target && (
          <div className="text-sm text-gray-500 mb-2">
            Target: {formatValue(target)}
            {target !== 0 && (
              <span className={`ml-2 ${value >= target ? 'text-green-600' : 'text-red-600'}`}>
                ({value >= target ? '+' : ''}{((value - target) / target * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        )}
        
        {trend && trendPercentage && (
          <div className={`flex items-center justify-center text-sm ${getTrendColor(trend)}`}>
            {getTrendIcon(trend)}
            <span className="ml-1">
              {Math.abs(trendPercentage).toFixed(1)}% 
              {trend === 'up' ? ' increase' : trend === 'down' ? ' decrease' : ' no change'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}