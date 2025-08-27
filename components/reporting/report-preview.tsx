'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Download, FileText, FileSpreadsheet, FileImage } from 'lucide-react'
import { ReportData, ReportDefinition } from '@/lib/types/reporting'

interface ReportPreviewProps {
  report: Partial<ReportDefinition>
  data: ReportData
  onExport: (format: 'pdf' | 'excel' | 'csv') => void
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export function ReportPreview({ report, data, onExport }: ReportPreviewProps) {
  const renderVisualization = () => {
    const visualization = report.visualization
    if (!visualization || !data.rows.length) {
      return <div className="text-center text-gray-500 py-8">No data to display</div>
    }

    switch (visualization.type) {
      case 'table':
        return (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {data.columns.map((column) => (
                    <TableHead key={column.key}>{column.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.slice(0, 100).map((row, index) => (
                  <TableRow key={index}>
                    {data.columns.map((column) => (
                      <TableCell key={column.key}>
                        {formatCellValue(row[column.key], column.type, column.format)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data.rows.length > 100 && (
              <div className="p-4 text-center text-sm text-gray-500 border-t">
                Showing first 100 rows of {data.total_rows} total rows
              </div>
            )}
          </div>
        )

      case 'chart':
        return renderChart(visualization.chartType || 'bar')

      case 'metric':
        return renderMetrics()

      case 'map':
        return (
          <div className="text-center text-gray-500 py-8">
            Map visualization not implemented in preview
          </div>
        )

      default:
        return <div className="text-center text-gray-500 py-8">Unknown visualization type</div>
    }
  }

  const renderChart = (chartType: string) => {
    const chartData = prepareChartData()
    
    if (!chartData.length) {
      return <div className="text-center text-gray-500 py-8">No data for chart</div>
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {getNumericColumns().map((column, index) => (
                <Bar 
                  key={column.key} 
                  dataKey={column.key} 
                  fill={COLORS[index % COLORS.length]} 
                  name={column.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {getNumericColumns().map((column, index) => (
                <Line 
                  key={column.key} 
                  type="monotone" 
                  dataKey={column.key} 
                  stroke={COLORS[index % COLORS.length]} 
                  name={column.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'pie':
        const pieData = chartData.slice(0, 10).map((item, index) => ({
          name: item.name,
          value: getNumericColumns()[0] ? item[getNumericColumns()[0].key] : 0,
          fill: COLORS[index % COLORS.length]
        }))

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center text-gray-500 py-8">Chart type not supported</div>
    }
  }

  const renderMetrics = () => {
    const numericColumns = getNumericColumns()
    if (!numericColumns.length) {
      return <div className="text-center text-gray-500 py-8">No numeric data for metrics</div>
    }

    const metrics = numericColumns.map(column => {
      const values = data.rows.map(row => Number(row[column.key]) || 0)
      const sum = values.reduce((a, b) => a + b, 0)
      const avg = sum / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)

      return {
        name: column.name,
        sum,
        avg,
        max,
        min,
        count: values.length
      }
    })

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-medium">{formatNumber(metric.sum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average:</span>
                <span className="font-medium">{formatNumber(metric.avg)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max:</span>
                <span className="font-medium">{formatNumber(metric.max)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Min:</span>
                <span className="font-medium">{formatNumber(metric.min)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Count:</span>
                <span className="font-medium">{metric.count}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const prepareChartData = () => {
    // Group data by first string column for chart x-axis
    const stringColumns = data.columns.filter(col => col.type === 'string')
    const numericColumns = getNumericColumns()
    
    if (!stringColumns.length || !numericColumns.length) return []

    const groupColumn = stringColumns[0]
    const grouped = data.rows.reduce((acc, row) => {
      const key = row[groupColumn.key] || 'Unknown'
      if (!acc[key]) {
        acc[key] = { name: key }
        numericColumns.forEach(col => {
          acc[key][col.key] = 0
        })
      }
      
      numericColumns.forEach(col => {
        acc[key][col.key] += Number(row[col.key]) || 0
      })
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(grouped).slice(0, 20) // Limit to 20 items for readability
  }

  const getNumericColumns = () => {
    return data.columns.filter(col => col.type === 'number')
  }

  const formatCellValue = (value: any, type: string, format?: string) => {
    if (value === null || value === undefined) return '-'
    
    switch (type) {
      case 'number':
        return formatNumber(value)
      case 'date':
        return new Date(value).toLocaleDateString()
      case 'boolean':
        return value ? 'Yes' : 'No'
      default:
        return String(value)
    }
  }

  const formatNumber = (value: number) => {
    if (isNaN(value)) return '-'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{report.name}</h2>
          {report.description && (
            <p className="text-gray-600 mt-1">{report.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="secondary">{report.category}</Badge>
            <span className="text-sm text-gray-500">
              {data.total_rows} rows • Generated in {data.execution_time_ms}ms
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
            <FileText className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
            <FileImage className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <Card>
        <CardContent className="p-6">
          {renderVisualization()}
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Fields:</span>
              <span className="ml-2 font-medium">{data.columns.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Rows:</span>
              <span className="ml-2 font-medium">{data.total_rows}</span>
            </div>
            <div>
              <span className="text-gray-600">Generated:</span>
              <span className="ml-2 font-medium">
                {new Date(data.generated_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Execution Time:</span>
              <span className="ml-2 font-medium">{data.execution_time_ms}ms</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}