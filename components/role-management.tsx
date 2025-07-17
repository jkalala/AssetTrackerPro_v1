import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const PERMISSION_OPTIONS = [
  { value: "manage:assets", label: "Manage Assets" },
  { value: "manage:geofences", label: "Manage Geofences" },
  { value: "manage:reports", label: "Manage Reports" },
  { value: "manage:users", label: "Manage Users" },
  { value: "view:reports", label: "View Reports" },
  { value: "view:audit", label: "View Audit Log" },
  { value: "manage:settings", label: "Manage Settings" },
]

export default function RoleManagement() {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<any>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/roles")
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRoles(data.roles)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (role: any) => {
    setEditRole(role)
    setEditPerms(role.permissions || [])
  }

  const handlePermChange = (perm: string) => {
    setEditPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])
  }

  const handleSave = async () => {
    if (!editRole) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/roles/${editRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: editPerms }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEditRole(null)
      setEditPerms([])
      fetchRoles()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {loading ? (
            <div>Loading roles...</div>
          ) : (
            <>
              <div className="mb-4 font-medium">Roles</div>
              <div className="space-y-2">
                {roles.length === 0 && <div className="text-gray-500">No roles found.</div>}
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center gap-4 border p-2 rounded">
                    <div className="flex-1">
                      <div className="font-semibold">{role.name}</div>
                      <div className="text-xs text-gray-500">Permissions: {role.permissions?.join(", ")}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(role)}>Edit</Button>
                  </div>
                ))}
              </div>
              {editRole && (
                <div className="mt-6 border rounded p-4 bg-gray-50">
                  <div className="font-medium mb-2">Edit Permissions for {editRole.name}</div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {PERMISSION_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-1">
                        <input type="checkbox" checked={editPerms.includes(opt.value)} onChange={() => handlePermChange(opt.value)} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                    <Button variant="outline" onClick={() => { setEditRole(null); setEditPerms([]); }}>Cancel</Button>
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