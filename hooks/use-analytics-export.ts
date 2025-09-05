import { useState } from 'react'

export interface ExportOptions {
  format: 'csv' | 'json'
  reportType:
    | 'overview'
    | 'categories'
    | 'status'
    | 'locations'
    | 'assets'
    | 'activity'
    | 'users'
    | 'all'
}

export function useAnalyticsExport() {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportData = async (options: ExportOptions) => {
    try {
      setExporting(true)
      setError(null)

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') ||
          `export-${Date.now()}.${options.format}`
        : `export-${Date.now()}.${options.format}`

      // Create a blob and download it
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true, filename }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed'
      setError(errorMessage)
      console.error('Export error:', err)
      return { success: false, error: errorMessage }
    } finally {
      setExporting(false)
    }
  }

  const exportAll = async (format: 'csv' | 'json' = 'json') => {
    return exportData({ format, reportType: 'all' })
  }

  const exportOverview = async (format: 'csv' | 'json' = 'json') => {
    return exportData({ format, reportType: 'overview' })
  }

  const exportCategories = async (format: 'csv' | 'json' = 'json') => {
    return exportData({ format, reportType: 'categories' })
  }

  const exportStatus = async (format: 'csv' | 'json' = 'json') => {
    return exportData({ format, reportType: 'status' })
  }

  const exportLocations = async (format: 'csv' | 'json' = 'json') => {
    return exportData({ format, reportType: 'locations' })
  }

  const exportAssets = async (format: 'csv' | 'json' = 'json') => {
    return exportData({ format, reportType: 'assets' })
  }

  const exportActivity = async (format: 'csv' | 'json' = 'json') => {
    return exportData({ format, reportType: 'activity' })
  }

  const exportUsers = async (format: 'csv' | 'json' = 'json') => {
    return exportData({ format, reportType: 'users' })
  }

  return {
    exporting,
    error,
    exportData,
    exportAll,
    exportOverview,
    exportCategories,
    exportStatus,
    exportLocations,
    exportAssets,
    exportActivity,
    exportUsers,
  }
}
