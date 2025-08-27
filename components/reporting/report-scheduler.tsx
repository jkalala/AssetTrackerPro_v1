'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Calendar, 
  Clock, 
  Mail, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Edit,
  Trash2,
  Play,
  Pause,
  Users
} from 'lucide-react'
import { ReportSchedule, ReportDefinition } from '@/lib/types/reporting'

interface ReportSchedulerProps {
  schedules: ReportSchedule[]
  reports: ReportDefinition[]
  onCreateSchedule: (schedule: Omit<ReportSchedule, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at' | 'next_run'>) => void
  onUpdateSchedule: (id: string, updates: Partial<ReportSchedule>) => void
  onDeleteSchedule: (id: string) => void
  onRunSchedule: (id: string) => void
}

export function ReportScheduler({ 
  schedules, 
  reports, 
  onCreateSchedule, 
  onUpdateSchedule, 
  onDeleteSchedule,
  onRunSchedule 
}: ReportSchedulerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    report_id: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    day_of_week: 1,
    day_of_month: 1,
    time: '09:00',
    timezone: 'UTC',
    format: 'pdf' as const,
    recipients: [] as string[],
    is_active: true
  })
  const [recipientInput, setRecipientInput] = useState('')

  const resetForm = () => {
    setFormData({
      name: '',
      report_id: '',
      frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
      day_of_week: 1,
      day_of_month: 1,
      time: '09:00',
      timezone: 'UTC',
      format: 'pdf',
      recipients: [],
      is_active: true
    })
    setRecipientInput('')
    setEditingSchedule(null)
  }

  const handleCreateSchedule = () => {
    setIsCreateDialogOpen(true)
    resetForm()
  }

  const handleEditSchedule = (schedule: ReportSchedule) => {
    setFormData({
      name: schedule.name,
      report_id: schedule.report_id,
      frequency: schedule.frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly',
      day_of_week: schedule.day_of_week || 1,
      day_of_month: schedule.day_of_month || 1,
      time: schedule.time,
      timezone: schedule.timezone,
      format: 'pdf' as const,
      recipients: schedule.recipients,
      is_active: schedule.is_active
    })
    setEditingSchedule(schedule)
    setIsCreateDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingSchedule) {
      onUpdateSchedule(editingSchedule.id, formData)
    } else {
      onCreateSchedule(formData)
    }
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const addRecipient = () => {
    if (recipientInput.trim() && !formData.recipients.includes(recipientInput.trim())) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, recipientInput.trim()]
      })
      setRecipientInput('')
    }
  }

  const removeRecipient = (email: string) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter(r => r !== email)
    })
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileImage className="h-4 w-4" />
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'csv':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFrequencyText = (schedule: ReportSchedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return `Weekly on ${days[schedule.day_of_week || 1]}`
      case 'monthly':
        return `Monthly on day ${schedule.day_of_month}`
      case 'quarterly':
        return `Quarterly on day ${schedule.day_of_month}`
      default:
        return schedule.frequency
    }
  }

  const getNextRunText = (nextRun: string) => {
    const date = new Date(nextRun)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Schedules</h2>
          <p className="text-gray-600">Automate report delivery with scheduled generation</p>
        </div>
        <Button onClick={handleCreateSchedule}>
          <Plus className="h-4 w-4 mr-1" />
          New Schedule
        </Button>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schedule Name</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => {
                const report = reports.find(r => r.id === schedule.report_id)
                return (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{schedule.name}</div>
                        <div className="text-sm text-gray-500">
                          {schedule.time} {schedule.timezone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report?.name || 'Unknown Report'}</div>
                        <Badge variant="outline" className="text-xs">
                          {report?.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{getFrequencyText(schedule)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getFormatIcon(schedule.format)}
                        <span className="text-sm uppercase">{schedule.format}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{schedule.recipients.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{getNextRunText(schedule.next_run)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRunSchedule(schedule.id)}
                          disabled={!schedule.is_active}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {schedules.length === 0 && (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
              <p className="text-gray-600 mb-4">Create your first scheduled report to automate delivery</p>
              <Button onClick={handleCreateSchedule}>
                <Plus className="h-4 w-4 mr-1" />
                Create Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Schedule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter schedule name"
                />
              </div>
              <div>
                <Label htmlFor="report-select">Report</Label>
                <Select value={formData.report_id} onValueChange={(value) => setFormData({ ...formData, report_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report" />
                  </SelectTrigger>
                  <SelectContent>
                    {reports.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Frequency Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.frequency === 'weekly' && (
                <div>
                  <Label htmlFor="day-of-week">Day of Week</Label>
                  <Select value={formData.day_of_week.toString()} onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {(formData.frequency === 'monthly' || formData.frequency === 'quarterly') && (
                <div>
                  <Label htmlFor="day-of-month">Day of Month</Label>
                  <Input
                    id="day-of-month"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({ ...formData, day_of_month: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {/* Format and Timezone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format">Output Format</Label>
                <Select value={formData.format} onValueChange={(value: any) => setFormData({ ...formData, format: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <Label htmlFor="recipients">Recipients</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter email address"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  />
                  <Button type="button" onClick={addRecipient}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.recipients.map((email, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is-active">Active</Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || !formData.report_id || formData.recipients.length === 0}
              >
                {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}