"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ name: "", parent_id: "" })
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({})
  const { toast } = useToast()

  const fetchCategories = async () => {
    setLoading(true)
    const res = await fetch("/api/categories")
    const json = await res.json()
    setCategories(json.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openAdd = (parent_id = "") => {
    setEditing(null)
    setForm({ name: "", parent_id })
    setShowDialog(true)
  }

  const openEdit = (cat: any) => {
    setEditing(cat)
    setForm({ name: cat.name, parent_id: cat.parent_id || "" })
    setShowDialog(true)
  }

  const handleSave = async () => {
    let res
    if (editing) {
      res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form })
      })
    } else {
      res = await fetch("/api/categories", {
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
      fetchCategories()
      toast({ title: "Saved", description: "Category saved." })
    }
  }

  const handleDelete = async (cat: any) => {
    if (!window.confirm("Delete this category and all its subcategories?")) return
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id })
    })
    const json = await res.json()
    if (json.error) {
      toast({ title: "Error", description: json.error, variant: "destructive" })
    } else {
      fetchCategories()
      toast({ title: "Deleted", description: "Category deleted." })
    }
  }

  // Helper to build tree
  const buildTree = (list: any[], parentId: string | null = null): any[] =>
    list.filter(c => (c.parent_id || "") === (parentId || "")).map((c: any) => ({
      ...c,
      children: buildTree(list, c.id)
    }))

  const renderTree = (nodes: any[], level = 0): JSX.Element[] => (
    nodes.map((node: any) => (
      <div key={node.id} style={{ marginLeft: level * 24 }} className="flex items-center py-1">
        {node.children.length > 0 ? (
          <Button variant="ghost" size="icon" onClick={() => setExpanded(e => ({ ...e, [node.id]: !e[node.id] }))}>
            {expanded[node.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : <span style={{ width: 32 }} />}
        <span className="font-medium mr-2">{node.name}</span>
        <Button variant="outline" size="icon" className="mr-1" onClick={() => openEdit(node)}><Edit className="h-4 w-4" /></Button>
        <Button variant="destructive" size="icon" className="mr-1" onClick={() => handleDelete(node)}><Trash2 className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => openAdd(node.id)}><Plus className="h-4 w-4" /></Button>
        {expanded[node.id] && node.children.length > 0 && (
          <div className="w-full">{renderTree(node.children, level + 1)}</div>
        )}
      </div>
    ))
  )

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Asset Categories</CardTitle>
          <Button onClick={() => openAdd()} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No categories defined yet.</div>
          ) : (
            <div>{renderTree(buildTree(categories))}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Category Name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Category"}</Button>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 