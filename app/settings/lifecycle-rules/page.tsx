"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const RULE_TYPES = [
  { value: "retire", label: "Retire" },
  { value: "archive", label: "Archive" },
  { value: "depreciate", label: "Depreciate" },
]
const TRIGGER_FIELDS = [
  { value: "purchase_date", label: "Purchase Date" },
  { value: "warranty_expiry", label: "Warranty Expiry" },
]

export default function LifecycleRulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({
    asset_id: "",
    type: "retire",
    trigger_field: "purchase_date",
    interval: "",
    trigger_date: "",
    status: "active"
  })
  const { toast } = useToast()

  const fetchRules = async () => {
    setLoading(true)
    const res = await fetch("/api/lifecycle-rules")
    const json = await res.json()
    setRules(json.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRules() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ asset_id: "", type: "retire", trigger_field: "purchase_date", interval: "", trigger_date: "", status: "active" })
    setShowDialog(true)
  }

  const openEdit = (rule: any) => {
    setEditing(rule)
    setForm({
      asset_id: rule.asset_id || "",
      type: rule.type,
      trigger_field: rule.trigger_field,
      interval: rule.interval || "",
      trigger_date: rule.trigger_date || "",
      status: rule.status
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    let res
    if (editing) {
      res = await fetch("/api/lifecycle-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form })
      })
    } else {
      res = await fetch("/api/lifecycle-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
    }
    const json = await res.json()
    if (json.error) {
      toast({ title: "Error", description: json.error, variant: "destructive" })
    } else {
      setShowDialog(false)
      fetchRules()
      toast({ title: "Saved", description: "Lifecycle rule saved." })
    }
  }

  const handleDelete = async (rule: any) => {
    if (!window.confirm("Delete this lifecycle rule?")) return
    const res = await fetch("/api/lifecycle-rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id })
    })
    const json = await res.json()
    if (json.error) {
      toast({ title: "Error", description: json.error, variant: "destructive" })
    } else {
      fetchRules()
      toast({ title: "Deleted", description: "Lifecycle rule deleted." })
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Asset Lifecycle Rules</CardTitle>
          <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading...</div>
          ) : rules.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No lifecycle rules defined yet.</div>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Trigger Field</th>
                  <th className="p-2 text-left">Interval</th>
                  <th className="p-2 text-left">Trigger Date</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Asset</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} className="border-t">
                    <td className="p-2 capitalize">{rule.type}</td>
                    <td className="p-2">{rule.trigger_field}</td>
                    <td className="p-2">{rule.interval}</td>
                    <td className="p-2">{rule.trigger_date}</td>
                    <td className="p-2">{rule.status}</td>
                    <td className="p-2">{rule.asset_name || (rule.asset_id ? rule.asset_id : <span className="text-gray-400">Global</span>)}</td>
                    <td className="p-2">
                      <Button variant="outline" size="icon" className="mr-1" onClick={() => openEdit(rule)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(rule)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Edit Lifecycle Rule" : "Add Lifecycle Rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={form.type} onValueChange={val => setForm((f: any) => ({ ...f, type: val }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map(rt => <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.trigger_field} onValueChange={val => setForm((f: any) => ({ ...f, trigger_field: val }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_FIELDS.map(tf => <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Interval (e.g. 5 years)" value={form.interval} onChange={e => setForm((f: any) => ({ ...f, interval: e.target.value }))} />
            <Input type="date" placeholder="Trigger Date (optional)" value={form.trigger_date} onChange={e => setForm((f: any) => ({ ...f, trigger_date: e.target.value }))} />
            <Select value={form.status} onValueChange={val => setForm((f: any) => ({ ...f, status: val }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Asset ID (leave blank for global rule)" value={form.asset_id} onChange={e => setForm((f: any) => ({ ...f, asset_id: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Rule"}</Button>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 