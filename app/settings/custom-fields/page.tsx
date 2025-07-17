"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "relation", label: "Relation" },
]

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({
    name: "",
    label: "",
    type: "text",
    options: "",
    required: false,
    validation: ""
  })
  const { toast } = useToast()

  const fetchFields = async () => {
    setLoading(true)
    const res = await fetch("/api/custom-fields")
    const json = await res.json()
    setFields(json.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchFields() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: "", label: "", type: "text", options: "", required: false, validation: "" })
    setShowDialog(true)
  }

  const openEdit = (field: any) => {
    setEditing(field)
    setForm({
      name: field.name,
      label: field.label,
      type: field.type,
      options: field.options ? (Array.isArray(field.options) ? field.options.join(",") : (typeof field.options === "string" ? field.options : "")) : "",
      required: field.required,
      validation: field.validation ? JSON.stringify(field.validation) : ""
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    const payload: any = {
      name: form.name,
      label: form.label,
      type: form.type,
      options: form.type === "dropdown" ? form.options.split(",").map((o: string) => o.trim()).filter(Boolean) : null,
      required: !!form.required,
      validation: form.validation ? JSON.parse(form.validation) : null
    }
    let res
    if (editing) {
      res = await fetch("/api/custom-fields", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload })
      })
    } else {
      res = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    }
    const json = await res.json()
    if (json.error) {
      toast({ title: "Error", description: json.error, variant: "destructive" })
    } else {
      setShowDialog(false)
      fetchFields()
      toast({ title: "Saved", description: "Custom field saved." })
    }
  }

  const handleDelete = async (field: any) => {
    if (!window.confirm("Delete this custom field?")) return
    const res = await fetch("/api/custom-fields", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: field.id })
    })
    const json = await res.json()
    if (json.error) {
      toast({ title: "Error", description: json.error, variant: "destructive" })
    } else {
      fetchFields()
      toast({ title: "Deleted", description: "Custom field deleted." })
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Custom Asset Fields</CardTitle>
          <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Field</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading...</div>
          ) : fields.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No custom fields defined yet.</div>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Label</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Required</th>
                  <th className="p-2 text-left">Options</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(field => (
                  <tr key={field.id} className="border-t">
                    <td className="p-2">{field.label}</td>
                    <td className="p-2">{field.name}</td>
                    <td className="p-2 capitalize">{field.type}</td>
                    <td className="p-2">{field.required ? "Yes" : "No"}</td>
                    <td className="p-2">{field.type === "dropdown" && field.options ? (Array.isArray(field.options) ? field.options.join(", ") : (typeof field.options === "string" ? field.options : "")) : "-"}</td>
                    <td className="p-2">
                      <Button variant="outline" size="icon" className="mr-1" onClick={() => openEdit(field)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(field)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Custom Field" : "Add Custom Field"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Field Label" value={form.label} onChange={e => setForm((f: any) => ({ ...f, label: e.target.value }))} />
            <Input placeholder="Field Name (unique)" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
            <Select value={form.type} onValueChange={val => setForm((f: any) => ({ ...f, type: val }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.type === "dropdown" && (
              <Input placeholder="Options (comma separated)" value={form.options} onChange={e => setForm((f: any) => ({ ...f, options: e.target.value }))} />
            )}
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={form.required} onChange={e => setForm((f: any) => ({ ...f, required: e.target.checked }))} id="required" />
              <label htmlFor="required">Required</label>
            </div>
            <Input placeholder='Validation (JSON, e.g. {"min":1,"max":10})' value={form.validation} onChange={e => setForm((f: any) => ({ ...f, validation: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Field"}</Button>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 