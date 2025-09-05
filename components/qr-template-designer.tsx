import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

const FIELD_OPTIONS = [
  { value: 'asset_id', label: 'Asset ID' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'status', label: 'Status' },
]

export default function QRTemplateDesigner() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    fields: ['asset_id', 'name'],
    fontSize: 14,
    labelPosition: 'below',
    qrSize: 120,
    is_default: false,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/qr-templates')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTemplates(data.templates)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFieldChange = (field: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field],
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = ev => {
        setForm(prev => ({ ...prev, logoUrl: ev.target?.result as string }))
        setPreviewUrl(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = (tpl: any) => {
    setEditId(tpl.id)
    setShowForm(true)
    setForm({
      name: tpl.name,
      logoUrl: tpl.config.logoUrl || '',
      fields: tpl.config.fields || ['asset_id', 'name'],
      fontSize: tpl.config.fontSize || 14,
      labelPosition: tpl.config.labelPosition || 'below',
      qrSize: tpl.config.qrSize || 120,
      is_default: tpl.is_default || false,
    })
    setPreviewUrl(tpl.config.logoUrl || '')
  }

  const handleSetDefault = async (id: string) => {
    setError(null)
    try {
      // Set is_default true for this template, false for others
      const res = await fetch(`/api/qr-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, is_default: true }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchTemplates()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const config = {
        logoUrl: form.logoUrl,
        fields: form.fields,
        fontSize: form.fontSize,
        labelPosition: form.labelPosition,
        qrSize: form.qrSize,
      }
      let res, data
      if (editId) {
        res = await fetch(`/api/qr-templates/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, config, is_default: form.is_default }),
        })
        data = await res.json()
      } else {
        res = await fetch('/api/qr-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, config, is_default: form.is_default }),
        })
        data = await res.json()
      }
      if (data.error) throw new Error(data.error)
      setShowForm(false)
      setEditId(null)
      setForm({
        name: '',
        logoUrl: '',
        fields: ['asset_id', 'name'],
        fontSize: 14,
        labelPosition: 'below',
        qrSize: 120,
        is_default: false,
      })
      setLogoFile(null)
      setPreviewUrl('')
      fetchTemplates()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    setError(null)
    try {
      const res = await fetch(`/api/qr-templates/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchTemplates()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Template Designer</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div>Loading templates...</div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="font-medium">Existing Templates</div>
                <Button onClick={() => setShowForm(v => !v)}>
                  {showForm ? 'Cancel' : 'New Template'}
                </Button>
              </div>
              <div className="space-y-2">
                {templates.length === 0 && <div className="text-gray-500">No templates found.</div>}
                {templates.map(tpl => (
                  <div key={tpl.id} className="flex items-center gap-4 border p-2 rounded">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {tpl.name}{' '}
                        {tpl.is_default && <span className="text-xs text-blue-600">(Default)</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        Fields: {tpl.config.fields?.join(', ')}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(tpl)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(tpl.id)}
                      disabled={tpl.is_default}
                    >
                      Set Default
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(tpl.id)}>
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
              {showForm && (
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <Input name="name" value={form.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Logo</label>
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                    {previewUrl && (
                      <img src={previewUrl} alt="Logo preview" className="mt-2 h-12" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fields to Display</label>
                    <div className="flex gap-2 flex-wrap">
                      {FIELD_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={form.fields.includes(opt.value)}
                            onChange={() => handleFieldChange(opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Font Size</label>
                      <Input
                        type="number"
                        name="fontSize"
                        value={form.fontSize}
                        onChange={handleInputChange}
                        min={8}
                        max={32}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Label Position</label>
                      <Select
                        value={form.labelPosition}
                        onValueChange={v => setForm(f => ({ ...f, labelPosition: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="below">Below QR</SelectItem>
                          <SelectItem value="above">Above QR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">QR Size (px)</label>
                      <Input
                        type="number"
                        name="qrSize"
                        value={form.qrSize}
                        onChange={handleInputChange}
                        min={80}
                        max={300}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_default}
                      onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                    />
                    <span>Set as default</span>
                  </div>
                  <Button type="submit">{editId ? 'Save Changes' : 'Save Template'}</Button>
                </form>
              )}
              {/* Live Preview */}
              {showForm && (
                <div className="mt-6">
                  <div className="font-medium mb-2">Live Preview</div>
                  <div
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 8,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: form.qrSize + 40,
                    }}
                  >
                    {form.labelPosition === 'above' && (
                      <div style={{ fontSize: form.fontSize, marginBottom: 8 }}>
                        {form.fields.map(f => f.toUpperCase()).join(' | ')}
                      </div>
                    )}
                    {form.logoUrl && (
                      <img src={form.logoUrl} alt="Logo" style={{ height: 32, marginBottom: 8 }} />
                    )}
                    <div
                      style={{
                        width: form.qrSize,
                        height: form.qrSize,
                        background: '#f3f3f3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: form.labelPosition === 'below' ? 8 : 0,
                      }}
                    >
                      <span style={{ color: '#bbb' }}>QR</span>
                    </div>
                    {form.labelPosition === 'below' && (
                      <div style={{ fontSize: form.fontSize, marginTop: 8 }}>
                        {form.fields.map(f => f.toUpperCase()).join(' | ')}
                      </div>
                    )}
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
