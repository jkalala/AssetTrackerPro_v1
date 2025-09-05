import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

const FIELD_OPTIONS = [
  { value: 'asset_id', label: 'Asset ID' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'status', label: 'Status' },
  { value: 'created_at', label: 'Created At' },
]

export default function CustomReportBuilder({
  report,
  onClose,
}: {
  report?: any
  onClose: () => void
}) {
  const [name, setName] = useState(report?.name || '')
  const [fields, setFields] = useState<string[]>(report?.config?.fields || ['asset_id', 'name'])
  const [dateFrom, setDateFrom] = useState(report?.config?.dateFrom || '')
  const [dateTo, setDateTo] = useState(report?.config?.dateTo || '')
  const [category, setCategory] = useState(report?.config?.category || '')
  const [status, setStatus] = useState(report?.config?.status || '')
  const [groupBy, setGroupBy] = useState(report?.config?.groupBy || '')
  const [sortBy, setSortBy] = useState(report?.config?.sortBy || '')
  const [sortDir, setSortDir] = useState(report?.config?.sortDir || 'asc')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleFieldChange = (field: string) => {
    setFields(prev => (prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const config = { fields, dateFrom, dateTo, category, status, groupBy, sortBy, sortDir }
      let res, data
      if (report) {
        res = await fetch(`/api/custom-reports/${report.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, config }),
        })
        data = await res.json()
      } else {
        res = await fetch('/api/custom-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, config }),
        })
        data = await res.json()
      }
      if (data.error) throw new Error(data.error)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border rounded p-4 mt-6 bg-gray-50">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">Report Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fields</label>
          <div className="flex gap-2 flex-wrap">
            {FIELD_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={fields.includes(opt.value)}
                  onChange={() => handleFieldChange(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Filters</label>
          <div className="flex gap-2 flex-wrap">
            <div>
              <label className="block text-xs mb-0.5">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs mb-0.5">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs mb-0.5">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. IT"
                className="border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs mb-0.5">Status</label>
              <input
                type="text"
                value={status}
                onChange={e => setStatus(e.target.value)}
                placeholder="e.g. active"
                className="border rounded px-2 py-1"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Group by</label>
            <select
              className="border rounded px-2 py-1"
              value={groupBy}
              onChange={e => setGroupBy(e.target.value)}
            >
              <option value="">None</option>
              {FIELD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort by</label>
            <select
              className="border rounded px-2 py-1"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="">None</option>
              {FIELD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort direction</label>
            <select
              className="border rounded px-2 py-1"
              value={sortDir}
              onChange={e => setSortDir(e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Report'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
