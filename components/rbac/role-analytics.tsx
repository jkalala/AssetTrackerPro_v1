'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Role } from '@/lib/types/rbac'

interface RoleAnalyticsProps {
  tenantId: string
  roles: Role[]
}

export function RoleAnalytics({ tenantId, roles }: RoleAnalyticsProps) {
  const totalRoles = roles.length
  const activeRoles = roles.filter(r => r.is_active).length
  const systemRoles = roles.filter(r => r.is_system_role).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoles}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRoles}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemRoles}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{role.display_name || role.name}</span>
                  <Badge variant={role.is_active ? 'default' : 'secondary'}>
                    {role.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {role.is_system_role && (
                    <Badge variant="outline">System</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Level {role.level}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}