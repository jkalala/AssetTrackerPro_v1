import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

const TRIGGER_OPTIONS = [
  { value: 'entry', label: 'Entry' },
  { value: 'exit', label: 'Exit' },
  { value: 'dwell', label: 'Dwell' },
]
const ESCALATION_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
]

export default function GeofenceRuleManager({
  assets = [],
  geofences = [],
}: {
  assets?: any[]
  geofences?: any[]
}) {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editRule, setEditRule] = useState<any>(null)
  const [form, setForm] = useState({
    asset_id: '',
    category: '',
    geofence_id: '',
    trigger_event: 'entry',
    min_duration_minutes: 0,
    notify_email: false,
    notify_in_app: true,
    escalation_level: 'info',
    is_active: true,
  })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/geofence-rules')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRules(data.rules)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    let newValue: any = value
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      newValue = e.target.checked
    }
    setForm(prev => ({ ...prev, [name]: newValue }))
  }

  const handleEdit = (rule: any) => {
    setEditRule(rule)
    setShowForm(true)
    setForm({
      asset_id: rule.asset_id || '',
      category: rule.category || '',
      geofence_id: rule.geofence_id || '',
      trigger_event: rule.trigger_event || 'entry',
      min_duration_minutes: rule.min_duration_minutes || 0,
      notify_email: !!rule.notify_email,
      notify_in_app: !!rule.notify_in_app,
      escalation_level: rule.escalation_level || 'info',
      is_active: !!rule.is_active,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      let res, data
      if (editRule) {
        res = await fetch(`/api/geofence-rules/${editRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        data = await res.json()
      } else {
        res = await fetch('/api/geofence-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        data = await res.json()
      }
      if (data.error) throw new Error(data.error)
      setShowForm(false)
      setEditRule(null)
      setForm({
        asset_id: '',
        category: '',
        geofence_id: '',
        trigger_event: 'entry',
        min_duration_minutes: 0,
        notify_email: false,
        notify_in_app: true,
        escalation_level: 'info',
        is_active: true,
      })
      fetchRules()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return
    setError(null)
    try {
      const res = await fetch(`/api/geofence-rules/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchRules()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Geofence Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div>Loading rules...</div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="font-medium">Existing Rules</div>
                <Button
                  onClick={() => {
                    setShowForm(true)
                    setEditRule(null)
                  }}
                >
                  New Rule
                </Button>
              </div>
              <div className="space-y-2">
                {rules.length === 0 && <div className="text-gray-500">No rules found.</div>}
                {rules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-4 border p-2 rounded">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {rule.trigger_event} - {rule.geofence_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        Asset: {rule.asset_id || 'Any'} | Category: {rule.category || 'Any'} |
                        Escalation: {rule.escalation_level}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(rule.id)}>
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
              {showForm && (
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Asset</label>
                      <select
                        name="asset_id"
                        className="border rounded px-2 py-1"
                        value={form.asset_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Any</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.asset_id} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <Input
                        name="category"
                        value={form.category}
                        onChange={handleInputChange}
                        placeholder="Any"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Geofence Zone</label>
                      <select
                        name="geofence_id"
                        className="border rounded px-2 py-1"
                        value={form.geofence_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select...</option>
                        {geofences.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Trigger Event</label>
                      <select
                        name="trigger_event"
                        className="border rounded px-2 py-1"
                        value={form.trigger_event}
                        onChange={handleInputChange}
                        required
                      >
                        {TRIGGER_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Min Duration (min)</label>
                      <Input
                        name="min_duration_minutes"
                        type="number"
                        value={form.min_duration_minutes}
                        onChange={handleInputChange}
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Escalation</label>
                      <select
                        name="escalation_level"
                        className="border rounded px-2 py-1"
                        value={form.escalation_level}
                        onChange={handleInputChange}
                      >
                        {ESCALATION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        name="notify_email"
                        checked={form.notify_email}
                        onChange={handleInputChange}
                      />{' '}
                      Email
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        name="notify_in_app"
                        checked={form.notify_in_app}
                        onChange={handleInputChange}
                      />{' '}
                      In-App
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleInputChange}
                      />{' '}
                      Active
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{editRule ? 'Save Changes' : 'Save Rule'}</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setEditRule(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
