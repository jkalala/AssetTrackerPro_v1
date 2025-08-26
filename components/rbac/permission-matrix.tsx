'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Role } from '@/lib/types/rbac'

interface PermissionMatrixProps {
  tenantId: string
  roles: Role[]
  canManageRoles: boolean
}

export function PermissionMatrix({ tenantId, roles, canManageRoles }: PermissionMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{role.display_name || role.name}</h3>
                <Badge variant={role.is_active ? 'default' : 'secondary'}>
                  {role.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
              <div className="text-sm text-muted-foreground">
                Level: {role.level} | Max Users: {role.max_users || 'Unlimited'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}