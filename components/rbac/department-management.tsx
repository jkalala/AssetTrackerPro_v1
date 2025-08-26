'use client'

// =====================================================
// DEPARTMENT MANAGEMENT COMPONENT
// =====================================================
// Component for managing organizational departments

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Building, 
  Settings,
  Trash2,
  Edit,
  Eye,
  UserPlus,
  AlertTriangle,
  TreePine
} from 'lucide-react'
import { Department, DepartmentHierarchyNode } from '@/lib/types/rbac'

interface DepartmentManagementProps {
  tenantId: string
  canManageDepartments?: boolean
}

export function DepartmentManagement({ 
  tenantId, 
  canManageDepartments = false 
}: DepartmentManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentHierarchy, setDepartmentHierarchy] = useState<DepartmentHierarchyNode[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list')
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAssignUsersDialog, setShowAssignUsersDialog] = useState(false)

  const loadDepartments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/departments?tenant_id=${tenantId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setDepartments(data.departments || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartmentHierarchy = async () => {
    try {
      const response = await fetch(`/api/departments/hierarchy?tenant_id=${tenantId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setDepartmentHierarchy(data.hierarchy || [])
    } catch (err: unknown) {
      console.error('Error loading department hierarchy:', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    loadDepartments()
    loadDepartmentHierarchy()
  }, [tenantId, loadDepartments, loadDepartmentHierarchy])



  const _handleCreateDepartment = async (departmentData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...departmentData, tenant_id: tenantId })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadDepartments()
      await loadDepartmentHierarchy()
      // setShowCreateDialog(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create department')
    }
  }

  const _handleUpdateDepartment = async (departmentId: string, updates: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, tenant_id: tenantId })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadDepartments()
      await loadDepartmentHierarchy()
      // setShowEditDialog(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update department')
    }
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}?tenant_id=${tenantId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadDepartments()
      await loadDepartmentHierarchy()
      setSelectedDepartment(null)
      setShowDeleteConfirm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete department')
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.code && dept.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const renderDepartmentHierarchy = (nodes: DepartmentHierarchyNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.department.id} className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
        <Card className="mb-2 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <Building className={`h-5 w-5 ${
                  node.department.department_type === 'operational' ? 'text-blue-600' :
                  node.department.department_type === 'administrative' ? 'text-green-600' :
                  node.department.department_type === 'technical' ? 'text-purple-600' :
                  node.department.department_type === 'financial' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">
                      {node.department.display_name}
                    </h3>
                    {node.department.code && (
                      <Badge variant="outline" className="text-xs">
                        {node.department.code}
                      </Badge>
                    )}
                  </div>
                  
                  {node.department.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {node.department.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{node.users?.length || 0} users</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Settings className="h-4 w-4" />
                      <span>{node.roles?.length || 0} roles</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {node.department.department_type}
                  </Badge>
                  {!node.department.is_active && (
                    <Badge variant="destructive" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Level {node.department.level}
                  </Badge>
                </div>

                {canManageDepartments && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedDepartment(node.department)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedDepartment(node.department)
                        setShowEditDialog(true)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Department
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedDepartment(node.department)
                        setShowAssignUsersDialog(true)
                      }}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Manage Users
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedDepartment(node.department)
                          setShowDeleteConfirm(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Department
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {node.children.length > 0 && (
          <div className="mt-2">
            {renderDepartmentHierarchy(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

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
          <h1 className="text-2xl font-bold">Department Management</h1>
          <p className="text-gray-600">Manage organizational structure and user assignments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('hierarchy')}
          >
            <TreePine className="h-4 w-4 mr-2" />
            Hierarchy
          </Button>
          {canManageDepartments && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Department
            </Button>
          )}
        </div>
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
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Departments</p>
                <p className="text-2xl font-bold">{departments.filter(d => d.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TreePine className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Root Departments</p>
                <p className="text-2xl font-bold">{departmentHierarchy.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Max Depth</p>
                <p className="text-2xl font-bold">
                  {departments.length > 0 ? Math.max(...departments.map(d => d.level)) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Department Content */}
      {viewMode === 'hierarchy' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Department Hierarchy</h3>
          {departmentHierarchy.length > 0 ? (
            <div className="space-y-2">
              {renderDepartmentHierarchy(departmentHierarchy)}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No departments found.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((department) => (
            <Card key={department.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className={`h-5 w-5 ${
                      department.department_type === 'operational' ? 'text-blue-600' :
                      department.department_type === 'administrative' ? 'text-green-600' :
                      department.department_type === 'technical' ? 'text-purple-600' :
                      department.department_type === 'financial' ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                    <CardTitle className="text-lg">{department.display_name}</CardTitle>
                  </div>
                  {canManageDepartments && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedDepartment(department)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedDepartment(department)
                          setShowEditDialog(true)
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Department
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedDepartment(department)
                          setShowAssignUsersDialog(true)
                        }}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Manage Users
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedDepartment(department)
                            setShowDeleteConfirm(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Department
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {department.description || 'No description'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {department.department_type}
                    </Badge>
                    {department.code && (
                      <Badge variant="outline" className="text-xs">
                        {department.code}
                      </Badge>
                    )}
                    {!department.is_active && (
                      <Badge variant="destructive" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Level {department.level}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created: {new Date(department.created_at).toLocaleDateString()}</span>
                    {department.budget_limit && (
                      <span>Budget: ${department.budget_limit.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredDepartments.length === 0 && viewMode === 'list' && (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No departments found matching your search.</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedDepartment && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete the department &quot;{selectedDepartment.display_name}&quot;? 
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
                  onClick={() => handleDeleteDepartment(selectedDepartment.id)}
                >
                  Delete Department
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}