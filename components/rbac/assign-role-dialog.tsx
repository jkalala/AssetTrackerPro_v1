'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Role } from '@/lib/types/rbac'

interface AssignRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
  tenantId: string
  onAssignComplete: () => void
}

export function AssignRoleDialog({ 
  open, 
  onOpenChange, 
  role, 
  tenantId, 
  onAssignComplete 
}: AssignRoleDialogProps) {
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Here you would call your role assignment API
      console.log('Assigning role', role.id, 'to user', userId, 'in tenant', tenantId)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onAssignComplete()
      setUserId('')
    } catch (error) {
      console.error('Error assigning role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Role: {role.display_name || role.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID or Email</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID or email"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !userId.trim()}>
              {isLoading ? 'Assigning...' : 'Assign Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}