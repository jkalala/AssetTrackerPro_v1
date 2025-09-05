'use client'

// =====================================================
// CREATE ROLE DIALOG
// =====================================================
// Dialog component for creating new roles with permissions

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Key, AlertTriangle, Search, X } from 'lucide-react'
import { Role, Permission, CreateRoleRequest } from '@/lib/types/rbac'

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateRole: (roleData: CreateRoleRequest) => Promise<void>
  existingRoles: Role[]
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onCreateRole,
  existingRoles,
}: CreateRoleDialogProps) {
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    display_name: '',
    description: '',
    parent_role_id: undefined,
    permission_names: [],
    is_default_role: false,
    max_users: undefined,
  })

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [permissionSearch, setPermissionSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPermissions()
      resetForm()
    }
  }, [open])

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPermissions(data.permissions || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      parent_role_id: undefined,
      permission_names: [],
      is_default_role: false,
      max_users: undefined,
    })
    setSelectedPermissions(new Set())
    setPermissionSearch('')
    setError(null)
    setNameError(null)
  }

  const validateRoleName = (name: string) => {
    if (!name) {
      setNameError(null)
      return
    }

    // Check format
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setNameError('Role name can only contain letters, numbers, underscores, and hyphens')
      return
    }

    // Check uniqueness
    if (existingRoles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
      setNameError('A role with this name already exists')
      return
    }

    setNameError(null)
  }

  const handlePermissionToggle = (permissionName: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions)
    if (checked) {
      newSelected.add(permissionName)
    } else {
      newSelected.delete(permissionName)
    }
    setSelectedPermissions(newSelected)

    setFormData(prev => ({
      ...prev,
      permission_names: Array.from(newSelected),
    }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.display_name) {
      setError('Name and display name are required')
      return
    }

    if (nameError) {
      setError('Please fix the role name error')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await onCreateRole(formData)
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  // Filter permissions based on search
  const filteredPermissions = permissions.filter(
    permission =>
      permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      permission.display_name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      permission.resource_type.toLowerCase().includes(permissionSearch.toLowerCase())
  )

  // Group permissions by resource type
  const permissionsByResource = filteredPermissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource_type]) {
        acc[permission.resource_type] = []
      }
      acc[permission.resource_type].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>
  )

  // Get available parent roles (excluding system roles and roles that would create circular references)
  const availableParentRoles = existingRoles.filter(role => !role.is_system_role && role.is_active)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Create New Role</span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., asset_manager"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={nameError ? 'border-red-500' : ''}
                />
                {nameError && <p className="text-sm text-red-600">{nameError}</p>}
                <p className="text-xs text-gray-500">
                  Used internally. Only letters, numbers, underscores, and hyphens allowed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="e.g., Asset Manager"
                  value={formData.display_name}
                  onChange={e => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                />
                <p className="text-xs text-gray-500">Human-readable name shown in the UI.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this role is for and what permissions it should have..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent_role">Parent Role</Label>
                <Select
                  value={formData.parent_role_id || ''}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      parent_role_id: value || undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parent role</SelectItem>
                    {availableParentRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.display_name} (Level {role.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Child roles inherit permissions from parent roles.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  min="1"
                  placeholder="No limit"
                  value={formData.max_users || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      max_users: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                />
                <p className="text-xs text-gray-500">
                  Maximum number of users that can have this role.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default_role}
                onCheckedChange={checked =>
                  setFormData(prev => ({
                    ...prev,
                    is_default_role: checked,
                  }))
                }
              />
              <Label htmlFor="is_default">Default Role</Label>
              <p className="text-xs text-gray-500">
                Automatically assigned to new users in this tenant.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <h3 className="font-semibold">Select Permissions</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{selectedPermissions.size} selected</Badge>
              </div>
            </div>

            {/* Permission Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search permissions..."
                value={permissionSearch}
                onChange={e => setPermissionSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Permissions Summary */}
            {selectedPermissions.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selected Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedPermissions).map(permissionName => {
                      const permission = permissions.find(p => p.name === permissionName)
                      return (
                        <Badge
                          key={permissionName}
                          variant="secondary"
                          className="flex items-center space-x-1"
                        >
                          <span>{permission?.display_name || permissionName}</span>
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-600"
                            onClick={() => handlePermissionToggle(permissionName, false)}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Permissions by Resource Type */}
            <div className="space-y-4">
              {Object.entries(permissionsByResource).map(([resourceType, resourcePermissions]) => (
                <Card key={resourceType}>
                  <CardHeader>
                    <CardTitle className="text-sm capitalize flex items-center justify-between">
                      <span>{resourceType.replace('_', ' ')} Permissions</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            resourcePermissions.forEach(p => handlePermissionToggle(p.name, true))
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            resourcePermissions.forEach(p => handlePermissionToggle(p.name, false))
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {resourcePermissions.map(permission => (
                        <div
                          key={permission.id}
                          className="flex items-start space-x-3 p-2 rounded border hover:bg-gray-50"
                        >
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.has(permission.name)}
                            onCheckedChange={checked =>
                              handlePermissionToggle(permission.name, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                              {permission.display_name}
                            </Label>
                            {permission.description && (
                              <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {permission.action}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {permission.scope}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {Object.keys(permissionsByResource).length === 0 && (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No permissions found matching your search.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.display_name || !!nameError}
          >
            {loading ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
