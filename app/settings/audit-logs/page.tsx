'use client'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    user_id: '',
    entity: '',
    action: '',
    date_from: '',
    date_to: '',
  })
  const [page, setPage] = useState(1)
  const pageSize = 50

  const fetchLogs = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      page: String(page),
      page_size: String(pageSize),
    })
    const res = await fetch(`/api/audit-logs?${params}`)
    const data = await res.json()
    setLogs(data.logs || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line
  }, [page])

  const handleFilterChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handleFilterSubmit = (e: any) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const exportCSV = () => {
    const params = new URLSearchParams({
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
    })
    window.open(`/api/audit-logs/export?${params}`, '_blank')
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 mb-4">
            <Input
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
              placeholder="User ID"
              className="w-40"
            />
            <Input
              name="entity"
              value={filters.entity}
              onChange={handleFilterChange}
              placeholder="Entity"
              className="w-32"
            />
            <Input
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              placeholder="Action"
              className="w-32"
            />
            <Input
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              type="date"
              className="w-36"
            />
            <Input
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              type="date"
              className="w-36"
            />
            <Button type="submit">Filter</Button>
            <Button type="button" variant="outline" onClick={exportCSV}>
              Export CSV
            </Button>
          </form>
          {loading ? (
            <div>Loading...</div>
          ) : logs.length === 0 ? (
            <div>No audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">User</th>
                    <th className="p-2 border">Action</th>
                    <th className="p-2 border">Entity</th>
                    <th className="p-2 border">Entity ID</th>
                    <th className="p-2 border">Details</th>
                    <th className="p-2 border">IP</th>
                    <th className="p-2 border">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="p-2 border">{log.created_at}</td>
                      <td className="p-2 border">{log.user_id}</td>
                      <td className="p-2 border">{log.action}</td>
                      <td className="p-2 border">{log.entity}</td>
                      <td className="p-2 border">{log.entity_id}</td>
                      <td className="p-2 border">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                      <td className="p-2 border">{log.ip_address || ''}</td>
                      <td className="p-2 border">{log.user_agent || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4">
                <Button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <span>
                  Page {page} / {Math.ceil(total / pageSize) || 1}
                </span>
                <Button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>
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
