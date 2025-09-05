'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CustomReportBuilder from '@/components/custom-report-builder'
import jsPDF from 'jspdf'

export default function CustomReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editReport, setEditReport] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [resultsFields, setResultsFields] = useState<string[]>([])
  const [runningReport, setRunningReport] = useState<string | null>(null)
  const [groupedResults, setGroupedResults] = useState<any[]>([])
  const [groupLabels, setGroupLabels] = useState<string[]>([])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/custom-reports')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReports(data.reports)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this report?')) return
    setError(null)
    try {
      const res = await fetch(`/api/custom-reports/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchReports()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleRun = async (report: any) => {
    setRunningReport(report.id)
    setResults([])
    setResultsFields([])
    setGroupedResults([])
    setGroupLabels([])
    try {
      // Fetch assets with selected fields and filters
      const fields = report.config.fields
      const params = new URLSearchParams()
      params.set('fields', fields.join(','))
      if (report.config.dateFrom) params.set('dateFrom', report.config.dateFrom)
      if (report.config.dateTo) params.set('dateTo', report.config.dateTo)
      if (report.config.category) params.set('category', report.config.category)
      if (report.config.status) params.set('status', report.config.status)
      const res = await fetch(`/api/assets?${params.toString()}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      let rows = data.assets
      // Sort
      if (report.config.sortBy) {
        rows = [...rows].sort((a, b) => {
          const dir = report.config.sortDir === 'desc' ? -1 : 1
          if (a[report.config.sortBy] < b[report.config.sortBy]) return -1 * dir
          if (a[report.config.sortBy] > b[report.config.sortBy]) return 1 * dir
          return 0
        })
      }
      setResults(rows)
      setResultsFields(fields)
      // Group
      if (report.config.groupBy) {
        const groupMap: Record<string, any[]> = {}
        for (const row of rows) {
          const key = row[report.config.groupBy] ?? '(none)'
          if (!groupMap[key]) groupMap[key] = []
          groupMap[key].push(row)
        }
        setGroupedResults(Object.values(groupMap))
        setGroupLabels(Object.keys(groupMap))
      } else {
        setGroupedResults([])
        setGroupLabels([])
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRunningReport(null)
    }
  }

  const exportCSV = () => {
    if (!results.length) return
    const csv = [
      resultsFields.join(','),
      ...results.map((row: any) => resultsFields.map(f => JSON.stringify(row[f] ?? '')).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'custom-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    if (!results.length) return
    const pdf = new jsPDF({ orientation: 'landscape' })
    let y = 20
    pdf.setFontSize(12)
    pdf.text('Custom Report', 14, y)
    y += 10
    // Header
    resultsFields.forEach((f, i) => {
      pdf.text(f, 14 + i * 40, y)
    })
    y += 8
    // Rows
    results.forEach((row, rowIdx) => {
      resultsFields.forEach((f, i) => {
        pdf.text(String(row[f] ?? ''), 14 + i * 40, y + rowIdx * 8)
      })
    })
    pdf.save('custom-report.pdf')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div>Loading reports...</div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="font-medium">Saved Reports</div>
                <Button
                  onClick={() => {
                    setShowBuilder(true)
                    setEditReport(null)
                  }}
                >
                  New Report
                </Button>
              </div>
              <div className="space-y-2">
                {reports.length === 0 && <div className="text-gray-500">No reports found.</div>}
                {reports.map(r => (
                  <div key={r.id} className="flex items-center gap-4 border p-2 rounded">
                    <div className="flex-1">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(r.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowBuilder(true)
                        setEditReport(r)
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)}>
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleRun(r)}
                      disabled={runningReport === r.id}
                    >
                      {runningReport === r.id ? 'Running...' : 'Run'}
                    </Button>
                  </div>
                ))}
              </div>
              {showBuilder && (
                <CustomReportBuilder
                  report={editReport}
                  onClose={() => {
                    setShowBuilder(false)
                    setEditReport(null)
                    fetchReports()
                  }}
                />
              )}
              {/* Results Table and Chart */}
              {results.length > 0 && (
                <div className="mt-8">
                  {/* Chart if grouped */}
                  {groupLabels.length > 0 && (
                    <div className="mb-4">
                      <div className="font-medium mb-2">Group Summary</div>
                      {/* Simple SVG bar chart */}
                      <svg width={groupLabels.length * 60} height="120">
                        {groupLabels.map((label, i) => {
                          const count = groupedResults[i]?.length || 0
                          const max = Math.max(...groupedResults.map(g => g.length)) || 1
                          const barHeight = (count / max) * 100
                          return (
                            <g key={label}>
                              <rect
                                x={i * 60 + 10}
                                y={110 - barHeight}
                                width="40"
                                height={barHeight}
                                fill="#2563eb"
                              />
                              <text x={i * 60 + 30} y={115} textAnchor="middle" fontSize="10">
                                {label}
                              </text>
                              <text
                                x={i * 60 + 30}
                                y={110 - barHeight - 4}
                                textAnchor="middle"
                                fontSize="10"
                              >
                                {count}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  )}
                  <div className="flex gap-2 mb-2">
                    <Button variant="outline" onClick={exportCSV}>
                      Export CSV
                    </Button>
                    <Button variant="outline" onClick={exportPDF}>
                      Export PDF
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border">
                      <thead>
                        <tr>
                          {resultsFields.map(f => (
                            <th
                              key={f}
                              className="border px-2 py-1 text-xs text-gray-600 bg-gray-50"
                            >
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupLabels.length > 0
                          ? groupedResults.flat().map((row, idx) => (
                              <tr key={idx} className="even:bg-gray-50">
                                {resultsFields.map(f => (
                                  <td key={f} className="border px-2 py-1 text-xs">
                                    {String(row[f] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))
                          : results.map((row, idx) => (
                              <tr key={idx} className="even:bg-gray-50">
                                {resultsFields.map(f => (
                                  <td key={f} className="border px-2 py-1 text-xs">
                                    {String(row[f] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
