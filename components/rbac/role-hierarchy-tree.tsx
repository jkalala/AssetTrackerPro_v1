'use client'

// =====================================================
// ROLE HIERARCHY TREE
// =====================================================
// Component for displaying and managing role hierarchy

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Shield, Users, Key, Plus, Edit, Trash2 } from 'lucide-react'
import { RoleHierarchyNode, Role } from '@/lib/types/rbac'

interface RoleHierarchyTreeProps {
  hierarchy: RoleHierarchyNode[]
  onRoleSelect?: (roleId: string) => void
  onCreateChildRole?: (parentRole: Role) => void
  onEditRole?: (role: Role) => void
  onDeleteRole?: (role: Role) => void
  canManageRoles?: boolean
}

export function RoleHierarchyTree({
  hierarchy,
  onRoleSelect,
  onCreateChildRole,
  onEditRole,
  onDeleteRole,
  canManageRoles = false,
}: RoleHierarchyTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleNode = (roleId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId)
    } else {
      newExpanded.add(roleId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderNode = (node: RoleHierarchyNode, level = 0) => {
    const isExpanded = expandedNodes.has(node.role.id)
    const hasChildren = node.children.length > 0

    return (
      <div key={node.role.id} className="w-full">
        <Card className={`mb-2 ${level > 0 ? 'ml-6' : ''} hover:shadow-md transition-shadow`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {/* Expand/Collapse Button */}
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleNode(node.role.id)}
                    className="p-1 h-6 w-6"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-6" />
                )}

                {/* Role Icon */}
                <div className="flex-shrink-0">
                  <Shield
                    className={`h-5 w-5 ${
                      node.role.is_system_role
                        ? 'text-red-600'
                        : node.role.is_default_role
                          ? 'text-blue-600'
                          : 'text-gray-600'
                    }`}
                  />
                </div>

                {/* Role Information */}
                <div className="flex-1 cursor-pointer" onClick={() => onRoleSelect?.(node.role.id)}>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{node.role.display_name}</h3>
                    <span className="text-sm text-gray-500">({node.role.name})</span>
                  </div>

                  {node.role.description && (
                    <p className="text-sm text-gray-600 mt-1">{node.role.description}</p>
                  )}

                  {/* Role Stats */}
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{node.user_count} users</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Key className="h-4 w-4" />
                      <span>{node.permissions.length} permissions</span>
                    </div>
                  </div>
                </div>

                {/* Role Badges */}
                <div className="flex flex-wrap gap-1">
                  {node.role.is_system_role && (
                    <Badge variant="destructive" className="text-xs">
                      System
                    </Badge>
                  )}
                  {node.role.is_default_role && (
                    <Badge variant="default" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {!node.role.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Level {node.role.level}
                  </Badge>
                </div>

                {/* Action Buttons */}
                {canManageRoles && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        onCreateChildRole?.(node.role)
                      }}
                      className="h-8 w-8 p-0"
                      title="Create child role"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>

                    {!node.role.is_system_role && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            onEditRole?.(node.role)
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit role"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            onDeleteRole?.(node.role)
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Permission Preview */}
            {node.permissions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {node.permissions.slice(0, 5).map(permission => (
                    <Badge key={permission.id} variant="outline" className="text-xs">
                      {permission.display_name}
                    </Badge>
                  ))}
                  {node.permissions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{node.permissions.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (hierarchy.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No roles found in the hierarchy.</p>
        {canManageRoles && (
          <Button className="mt-4" onClick={() => onCreateChildRole?.(null as any)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Root Role
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hierarchy Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allRoleIds = new Set<string>()
              const collectRoleIds = (nodes: RoleHierarchyNode[]) => {
                nodes.forEach(node => {
                  allRoleIds.add(node.role.id)
                  collectRoleIds(node.children)
                })
              }
              collectRoleIds(hierarchy)
              setExpandedNodes(allRoleIds)
            }}
          >
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExpandedNodes(new Set())}>
            Collapse All
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {hierarchy.length} root role{hierarchy.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="space-y-2">{hierarchy.map(node => renderNode(node))}</div>

      {/* Legend */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-red-600" />
              <span>System Role</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Default Role</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <span>Custom Role</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Level
              </Badge>
              <span>Hierarchy Level</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
