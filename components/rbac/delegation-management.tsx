'use client'

// =====================================================
// DELEGATION MANAGEMENT COMPONENT
// =====================================================
// Component for managing permission delegations and guest access

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  Share, 
  Clock,
  Trash2,
  Eye,
  UserPlus,
  AlertTriangle,
  Calendar,
  Mail,
  Shield,
  Key
} from 'lucide-react'
import { PermissionDelegationWithProfiles, GuestAccessWithRole } from '@/lib/types/rbac'

interface DelegationManagementProps {
  tenantId: string
  currentUserId: string
  canManageDelegations?: boolean
}

export function DelegationManagement({ 
  tenantId, 
  currentUserId, 
  canManageDelegations = false 
}: DelegationManagementProps) {
  const [delegations, setDelegations] = useState<PermissionDelegationWithProfiles[]>([])
  const [guestAccess, setGuestAccess] = useState<GuestAccessWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('delegations')
  
  // Dialog states
  const [_showCreateDelegationDialog, _setShowCreateDelegationDialog] = useState(false)
  const [_showCreateGuestDialog, _setShowCreateGuestDialog] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PermissionDelegationWithProfiles | GuestAccessWithRole | null>(null)

  const loadDelegations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/delegations?tenant_id=${tenantId}&user_id=${currentUserId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setDelegations(data.delegations || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load delegations')
    } finally {
      setLoading(false)
    }
  }

  const loadGuestAccess = async () => {
    try {
      const response = await fetch(`/api/guest-access?tenant_id=${tenantId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setGuestAccess(data.guestAccess || [])
    } catch (err: unknown) {
      console.error('Error loading guest access:', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    loadDelegations()
    loadGuestAccess()
  }, [tenantId, currentUserId, loadDelegations, loadGuestAccess])



  const loadGuestAccess = async () => {
    try {
      const response = await fetch(`/api/guest-access?tenant_id=${tenantId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setGuestAccess(data.guestAccess || [])
    } catch (err: unknown) {
      console.error('Error loading guest access:', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const _handleCreateDelegation = async (delegationData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...delegationData, 
          tenant_id: tenantId,
          delegator_id: currentUserId
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadDelegations()
      // setShowCreateDelegationDialog(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create delegation')
    }
  }

  const _handleCreateGuestAccess = async (guestData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...guestData, 
          tenant_id: tenantId,
          invited_by: currentUserId
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadGuestAccess()
      // setShowCreateGuestDialog(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create guest access')
    }
  }

  const handleRevokeDelegation = async (delegationId: string) => {
    try {
      const response = await fetch(`/api/delegations/${delegationId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenant_id: tenantId,
          revoked_by: currentUserId
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadDelegations()
      setShowRevokeConfirm(false)
      setSelectedItem(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke delegation')
    }
  }

  const handleRevokeGuestAccess = async (guestId: string) => {
    try {
      const response = await fetch(`/api/guest-access/${guestId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      await loadGuestAccess()
      setShowRevokeConfirm(false)
      setSelectedItem(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke guest access')
    }
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) <= new Date()
    
    if (status === 'revoked') {
      return <Badge variant="destructive">Revoked</Badge>
    }
    
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>
    }
    
    if (status === 'active') {
      return <Badge variant="default">Active</Badge>
    }
    
    return <Badge variant="outline">{status}</Badge>
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) {
      return 'Expired'
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} remaining`
    }
    
    return `${hours} hour${hours !== 1 ? 's' : ''} remaining`
  }

  const filteredDelegations = delegations.filter(delegation =>
    delegation.delegatee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delegation.delegator?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delegation.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredGuestAccess = guestAccess.filter(guest =>
    guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold">Delegation Management</h1>
          <p className="text-gray-600">Manage permission delegations and guest access</p>
        </div>
        {canManageDelegations && (
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowCreateDelegationDialog(true)}>
              <Share className="h-4 w-4 mr-2" />
              Create Delegation
            </Button>
            <Button variant="outline" onClick={() => setShowCreateGuestDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Guest
            </Button>
          </div>
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
              <Share className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Delegations</p>
                <p className="text-2xl font-bold">{delegations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Delegations</p>
                <p className="text-2xl font-bold">
                  {delegations.filter(d => d.status === 'active' && new Date(d.expires_at) > new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Guest Access</p>
                <p className="text-2xl font-bold">{guestAccess.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active Guests</p>
                <p className="text-2xl font-bold">
                  {guestAccess.filter(g => g.is_active && new Date(g.expires_at) > new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search delegations and guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="delegations">
            <Share className="h-4 w-4 mr-2" />
            Delegations ({delegations.length})
          </TabsTrigger>
          <TabsTrigger value="guest-access">
            <UserPlus className="h-4 w-4 mr-2" />
            Guest Access ({guestAccess.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delegations" className="space-y-4">
          {filteredDelegations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredDelegations.map((delegation) => (
                <Card key={delegation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <Share className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">
                              {delegation.delegator?.full_name || delegation.delegator?.email} 
                              → {delegation.delegatee?.full_name || delegation.delegatee?.email}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {delegation.reason || 'No reason provided'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {getStatusBadge(delegation.status, delegation.expires_at)}
                          <Badge variant="outline" className="text-xs">
                            {delegation.scope}
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatTimeRemaining(delegation.expires_at)}</span>
                          </div>
                        </div>

                        {delegation.permission_ids && delegation.permission_ids.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {delegation.permission_ids.length} permission{delegation.permission_ids.length !== 1 ? 's' : ''} delegated
                            </span>
                          </div>
                        )}

                        {delegation.role && (
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Role: {delegation.role.display_name}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Created: {new Date(delegation.created_at).toLocaleDateString()} • 
                          Expires: {new Date(delegation.expires_at).toLocaleDateString()}
                        </div>
                      </div>

                      {canManageDelegations && delegation.delegator_id === currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedItem(delegation)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {delegation.status === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedItem(delegation)
                                  setShowRevokeConfirm(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Revoke Delegation
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Share className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No delegations found.</p>
              {canManageDelegations && (
                <Button 
                  className="mt-4"
                  onClick={() => setShowCreateDelegationDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Delegation
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="guest-access" className="space-y-4">
          {filteredGuestAccess.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredGuestAccess.map((guest) => (
                <Card key={guest.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-green-600" />
                          <div>
                            <h3 className="font-semibold">
                              {guest.full_name || guest.email}
                            </h3>
                            <p className="text-sm text-gray-600">{guest.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {getStatusBadge(guest.is_active ? 'active' : 'inactive', guest.expires_at)}
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatTimeRemaining(guest.expires_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Users className="h-4 w-4" />
                            <span>{guest.login_count} login{guest.login_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {guest.role && (
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Role: {guest.role.display_name}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Invited: {new Date(guest.created_at).toLocaleDateString()} • 
                          Expires: {new Date(guest.expires_at).toLocaleDateString()}
                          {guest.first_login_at && (
                            <> • First login: {new Date(guest.first_login_at).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>

                      {canManageDelegations && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedItem(guest)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {guest.is_active && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedItem(guest)
                                  setShowRevokeConfirm(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Revoke Access
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No guest access found.</p>
              {canManageDelegations && (
                <Button 
                  className="mt-4"
                  onClick={() => setShowCreateGuestDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invite First Guest
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Revoke Confirmation Dialog */}
      {selectedItem && (
        <Dialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {'delegator_id' in selectedItem ? 'Revoke Delegation' : 'Revoke Guest Access'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to revoke this {'delegator_id' in selectedItem ? 'delegation' : 'guest access'}? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRevokeConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if ('delegator_id' in selectedItem) {
                      handleRevokeDelegation(selectedItem.id)
                    } else {
                      handleRevokeGuestAccess(selectedItem.id)
                    }
                  }}
                >
                  Revoke {'delegator_id' in selectedItem ? 'Delegation' : 'Access'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}