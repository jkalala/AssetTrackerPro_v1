'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { SecurityEvent } from '@/lib/types/database'

interface SecurityEventWithProfile extends SecurityEvent {
  profiles?: {
    full_name: string | null
    email: string
  }
}

const ADMIN_ROLES = ['admin', 'owner']

export default function SecurityEventsPage() {
  const { user, loading: authLoading, role } = useAuth()
  const [events, setEvents] = useState<SecurityEventWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const eventTypes = [
    'all',
    'login_success',
    'login_failure',
    'mfa_success',
    'mfa_failure',
    'password_change',
    'account_locked',
    'account_unlocked',
    'suspicious_activity',
    'api_key_created',
    'api_key_revoked',
    'session_terminated',
    'concurrent_session_limit',
  ]

  const severityLevels = ['all', 'low', 'medium', 'high', 'critical']

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page: page.toString(),
          limit: '50',
        })

        if (eventTypeFilter !== 'all') {
          params.append('eventType', eventTypeFilter)
        }

        if (severityFilter !== 'all') {
          params.append('severity', severityFilter)
        }

        const response = await fetch(`/api/admin/security-events?${params}`)

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access denied. Admin privileges required.')
          }
          throw new Error('Failed to fetch security events')
        }

        const data = await response.json()

        if (data.success) {
          setEvents(data.data)
          setTotalPages(data.pagination.totalPages)
        } else {
          throw new Error(data.error || 'Failed to fetch security events')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user && role && ADMIN_ROLES.includes(role)) {
      fetchEvents()
    }
  }, [page, eventTypeFilter, severityFilter, user, role, authLoading])

  const handleFilterReset = () => {
    setEventTypeFilter('all')
    setSeverityFilter('all')
    setPage(1)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4" />
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <Shield className="h-4 w-4" />
      case 'low':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  // Check if user is authenticated and has admin role
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>You must be logged in to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!role || !ADMIN_ROLES.includes(role)) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading && events.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Security Events</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and investigate security events across your organization
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter security events by type and severity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="eventType" className="block text-sm font-medium mb-2">
                Event Type
              </label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger name="eventType">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Events' : formatEventType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="severity" className="block text-sm font-medium mb-2">
                Severity
              </label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger name="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level === 'all'
                        ? 'All Severities'
                        : level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleFilterReset} variant="outline">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>{events.length} events found</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No security events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="events-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(event => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge variant="outline" data-testid={`event-type-${event.event_type}`}>
                          {formatEventType(event.event_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getSeverityColor(event.severity)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getSeverityIcon(event.severity)}
                          {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.profiles?.full_name || event.profiles?.email || 'System'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(event.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={event.is_resolved ? 'default' : 'secondary'}>
                          {event.is_resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
