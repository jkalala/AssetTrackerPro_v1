'use client'

// =====================================================
// ROLE MANAGEMENT DASHBOARD
// =====================================================
// Main dashboard component for managing roles and permissions

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Users, 
  Shield, 
  Settings,
  Trash2,
  Edit,
  Eye,
  UserPlus,
  AlertTriangle
} from 'lucide-react'
import { RoleHierarchyTree } from './role-hierarchy-tree'
import { CreateRoleDialog } from './create-role-dialog'
import { EditRoleDialog } from './edit-role-dialog'
import { AssignRoleDialog } from './assign-role-dialog'
import { PermissionMatrix } from './permission-matrix'
import { RoleAnalytics } from './role-analytics'
import { Role, RoleWithPermissions, RoleHierarchyNode } from '@/lib/types/rbac'

interface RoleManagementDashboardProps {
  tenantId: string
  canManageRoles?: boolean
}

export function RoleManagementDashboard({ 
  tenantId, 
  canManageRoles = false 
}: RoleManagementDashboardProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchyNode[]>([])
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/roles?tenant_id=${tenantId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setRoles(data.roles || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const loadRoleHierarchy = async () => {
    try {
      const response = await fetch(`/api/roles/hierarchy?tenant_id=${tenantId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setRoleHierarchy(data.hierarchy || [])
    } catch (err: unknown) {
      console.error('Error loading role hierarchy:', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    loadRoles()
    loadRoleHierarchy()
  }, [tenantId, loadRoles, loadRoleHierarchy])

  const loadRoleDetails = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}?tenant_id=${tenantId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setSelectedRole(data.role)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load role details')
    }
  }

  const handleCreateRole = async (roleData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roleData, tenant_id: tenantId })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadRoles()
      await loadRoleHierarchy()
      setShowCreateDialog(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create role')
    }
  }

  const handleUpdateRole = async (roleId: string, updates: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, tenant_id: tenantId })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadRoles()
      await loadRoleHierarchy()
      if (selectedRole?.id === roleId) {
        await loadRoleDetails(roleId)
      }
      setShowEditDialog(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}?tenant_id=${tenantId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadRoles()
      await loadRoleHierarchy()
      if (selectedRole?.id === roleId) {
        setSelectedRole(null)
      }
      setShowDeleteConfirm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete role')
    }
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-gray-600">Manage roles, permissions, and user assignments</p>
        </div>
        {canManageRoles && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => r.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">System Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => r.is_system_role).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Default Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => r.is_default_role).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Roles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{role.display_name}</CardTitle>
                    </div>
                    {canManageRoles && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => loadRoleDetails(role.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {!role.is_system_role && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setSelectedRole(role as RoleWithPermissions)
                                setShowEditDialog(true)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedRole(role as RoleWithPermissions)
                                setShowAssignDialog(true)
                              }}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Users
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedRole(role as RoleWithPermissions)
                                  setShowDeleteConfirm(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Role
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{role.description || 'No description'}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {role.is_system_role && (
                        <Badge variant="secondary">System</Badge>
                      )}
                      {role.is_default_role && (
                        <Badge variant="outline">Default</Badge>
                      )}
                      {!role.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                      <Badge variant="outline">Level {role.level}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Created: {new Date(role.created_at).toLocaleDateString()}</span>
                      {role.max_users && (
                        <span>Max Users: {role.max_users}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No roles found matching your search.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Role Hierarchy</CardTitle>
              <p className="text-sm text-gray-600">
                Visual representation of role inheritance and relationships
              </p>
            </CardHeader>
            <CardContent>
              <RoleHierarchyTree 
                hierarchy={roleHierarchy}
                onRoleSelect={loadRoleDetails}
                canManageRoles={canManageRoles}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionMatrix 
            tenantId={tenantId}
            roles={roles}
            canManageRoles={canManageRoles}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <RoleAnalytics 
            tenantId={tenantId}
            roles={roles}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateRole={handleCreateRole}
        tenantId={tenantId}
        existingRoles={roles}
      />

      {selectedRole && (
        <>
          <EditRoleDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            role={selectedRole}
            onUpdateRole={handleUpdateRole}
            existingRoles={roles}
          />

          <AssignRoleDialog
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            role={selectedRole}
            tenantId={tenantId}
            onAssignComplete={() => {
              setShowAssignDialog(false)
              loadRoleDetails(selectedRole.id)
            }}
          />

          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete the role &quot;{selectedRole.display_name}&quot;? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDeleteRole(selectedRole.id)}
                  >
                    Delete Role
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}