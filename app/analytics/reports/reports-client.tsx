'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Calendar, 
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Download,
  Play
} from 'lucide-react'
import { ReportBuilder } from '@/components/reporting/report-builder'
import { ReportPreview } from '@/components/reporting/report-preview'
import { ReportScheduler } from '@/components/reporting/report-scheduler'
import { ExecutiveDashboard } from '@/components/reporting/executive-dashboard'
import { 
  ReportDefinition, 
  ReportTemplate, 
  ReportSchedule, 
  ReportExecution,
  ExecutiveDashboard as ExecutiveDashboardType,
  AvailableField,
  ReportData 
} from '@/lib/types/reporting'

export function ReportsPageClient() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('reports')
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<ReportDefinition | null>(null)
  const [previewData, setPreviewData] = useState<{ report: Partial<ReportDefinition>, data: ReportData } | null>(null)
  
  // Data states
  const [reports, setReports] = useState<ReportDefinition[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [executions, setExecutions] = useState<ReportExecution[]>([])
  const [executiveDashboards, setExecutiveDashboards] = useState<ExecutiveDashboardType[]>([])
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [
        reportsRes,
        templatesRes,
        schedulesRes,
        executionsRes,
        dashboardsRes,
        fieldsRes
      ] = await Promise.all([
        fetch('/api/analytics/reports'),
        fetch('/api/analytics/reports/templates'),
        fetch('/api/analytics/reports/schedules'),
        fetch('/api/analytics/reports/executions'),
        fetch('/api/analytics/reports/executive-dashboards'),
        fetch('/api/analytics/reports/fields')
      ])

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData)
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData)
      }

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json()
        setSchedules(schedulesData)
      }

      if (executionsRes.ok) {
        const executionsData = await executionsRes.json()
        setExecutions(executionsData)
      }

      if (dashboardsRes.ok) {
        const dashboardsData = await dashboardsRes.json()
        setExecutiveDashboards(dashboardsData)
      }

      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json()
        setAvailableFields(fieldsData)
      }

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reporting data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = () => {
    setEditingReport(null)
    setIsBuilderOpen(true)
  }

  const handleEditReport = (report: ReportDefinition) => {
    setEditingReport(report)
    setIsBuilderOpen(true)
  }

  const handleSaveReport = async (reportData: Omit<ReportDefinition, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    try {
      const url = editingReport 
        ? `/api/analytics/reports/${editingReport.id}`
        : '/api/analytics/reports'
      
      const method = editingReport ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        const savedReport = await response.json()
        
        if (editingReport) {
          setReports(reports.map(r => r.id === editingReport.id ? savedReport : r))
          toast({
            title: 'Success',
            description: 'Report updated successfully'
          })
        } else {
          setReports([savedReport, ...reports])
          toast({
            title: 'Success',
            description: 'Report created successfully'
          })
        }
        
        setIsBuilderOpen(false)
        setEditingReport(null)
      } else {
        throw new Error('Failed to save report')
      }
    } catch (error) {
      console.error('Error saving report:', error)
      toast({
        title: 'Error',
        description: 'Failed to save report',
        variant: 'destructive'
      })
    }
  }

  const handlePreviewReport = async (reportData: Omit<ReportDefinition, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/analytics/reports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData({ report: reportData, data })
        setIsPreviewOpen(true)
      } else {
        throw new Error('Failed to generate preview')
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate report preview',
        variant: 'destructive'
      })
    }
  }

  const handleRunReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/analytics/reports/${reportId}/run`, {
        method: 'POST'
      })

      if (response.ok) {
        const execution = await response.json()
        setExecutions([execution, ...executions])
        toast({
          title: 'Success',
          description: 'Report execution started'
        })
      } else {
        throw new Error('Failed to run report')
      }
    } catch (error) {
      console.error('Error running report:', error)
      toast({
        title: 'Error',
        description: 'Failed to run report',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/analytics/reports/${reportId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReports(reports.filter(r => r.id !== reportId))
        toast({
          title: 'Success',
          description: 'Report deleted successfully'
        })
      } else {
        throw new Error('Failed to delete report')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive'
      })
    }
  }

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!previewData) return

    try {
      const response = await fetch('/api/analytics/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: previewData.report,
          data: previewData.data,
          format
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Success',
          description: `Report exported as ${format.toUpperCase()}`
        })
      } else {
        throw new Error('Failed to export report')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive'
      })
    }
  }

  const handleCreateSchedule = async (scheduleData: Omit<ReportSchedule, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at' | 'next_run'>) => {
    try {
      const response = await fetch('/api/analytics/reports/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      })

      if (response.ok) {
        const schedule = await response.json()
        setSchedules([schedule, ...schedules])
        toast({
          title: 'Success',
          description: 'Schedule created successfully'
        })
      } else {
        throw new Error('Failed to create schedule')
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to create schedule',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateSchedule = async (scheduleId: string, updates: Partial<ReportSchedule>) => {
    try {
      const response = await fetch(`/api/analytics/reports/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedSchedule = await response.json()
        setSchedules(schedules.map(s => s.id === scheduleId ? updatedSchedule : s))
        toast({
          title: 'Success',
          description: 'Schedule updated successfully'
        })
      } else {
        throw new Error('Failed to update schedule')
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/analytics/reports/schedules/${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSchedules(schedules.filter(s => s.id !== scheduleId))
        toast({
          title: 'Success',
          description: 'Schedule deleted successfully'
        })
      } else {
        throw new Error('Failed to delete schedule')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive'
      })
    }
  }

  const handleRunSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/analytics/reports/schedules/${scheduleId}/run`, {
        method: 'POST'
      })

      if (response.ok) {
        const execution = await response.json()
        setExecutions([execution, ...executions])
        toast({
          title: 'Success',
          description: 'Scheduled report executed successfully'
        })
      } else {
        throw new Error('Failed to run scheduled report')
      }
    } catch (error) {
      console.error('Error running scheduled report:', error)
      toast({
        title: 'Error',
        description: 'Failed to run scheduled report',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Reporting</h1>
          <p className="text-gray-600">Create, schedule, and manage comprehensive reports</p>
        </div>
        <Button onClick={handleCreateReport}>
          <Plus className="h-4 w-4 mr-1" />
          New Report
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="executive">Executive</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{report.name}</span>
                    <Badge variant="outline">{report.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {report.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {report.fields?.length || 0} fields
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRunReport(report.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditReport(report)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {reports.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
                <p className="text-gray-600 mb-4">Create your first report to get started</p>
                <Button onClick={handleCreateReport}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <ReportScheduler
            schedules={schedules}
            reports={reports}
            onCreateSchedule={handleCreateSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onRunSchedule={handleRunSchedule}
          />
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution) => {
                  const report = reports.find(r => r.id === execution.report_id)
                  return (
                    <div key={execution.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <div className="font-medium">{report?.name || 'Unknown Report'}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(execution.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant={
                            execution.status === 'completed' ? 'default' :
                            execution.status === 'failed' ? 'destructive' :
                            execution.status === 'running' ? 'secondary' : 'outline'
                          }
                        >
                          {execution.status}
                        </Badge>
                        {execution.result_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={execution.result_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Executive Tab */}
        <TabsContent value="executive">
          {executiveDashboards.length > 0 ? (
            <ExecutiveDashboard
              dashboard={executiveDashboards[0]}
              onRefresh={() => loadData()}
              onExport={(format) => console.log('Export executive dashboard:', format)}
              onConfigure={() => console.log('Configure executive dashboard')}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Executive Dashboard</h3>
                <p className="text-gray-600 mb-4">Create an executive dashboard for high-level insights</p>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'Edit Report' : 'Create New Report'}
            </DialogTitle>
          </DialogHeader>
          <ReportBuilder
            availableFields={availableFields}
            initialReport={editingReport || undefined}
            onSave={handleSaveReport}
            onPreview={handlePreviewReport}
          />
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
          </DialogHeader>
          {previewData && (
            <ReportPreview
              report={previewData.report}
              data={previewData.data}
              onExport={handleExportReport}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}