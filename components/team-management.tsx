'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Mail, Loader2, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'

const ROLES = ['admin', 'manager', 'user']

export default function TeamManagement() {
  const [members, setMembers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteDialog, setInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('user')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [teamId, setTeamId] = useState<string | null>(null)

  // Fetch teamId for current user
  useEffect(() => {
    async function fetchTeamId() {
      setLoading(true)
      setError(null)
      try {
        const supabase = createClient()
        const { data: profile } = await supabase.from('profiles').select('team_id').single()
        if (profile?.team_id) setTeamId(profile.team_id)
      } catch (e: any) {
        setError('Failed to load team info')
      } finally {
        setLoading(false)
      }
    }
    fetchTeamId()
  }, [])

  // Fetch members and invitations
  useEffect(() => {
    if (!teamId) return
    setLoading(true)
    setError(null)
    async function fetchData() {
      try {
        const supabase = createClient()
        const [membersRes, invitesRes] = await Promise.all([
          supabase.rpc('get_team_members', { team_id: teamId }),
          fetch(`/api/teams/${teamId}/invitations`).then(r => r.json()),
        ])
        setMembers(membersRes.data || [])
        setInvitations(invitesRes.invitations || [])
      } catch (e: any) {
        setError('Failed to load team data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [teamId])

  async function handleInvite() {
    setInviteLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, team_id: teamId }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to invite')
      setInviteDialog(false)
      setInviteEmail('')
      setInviteRole('user')
      // Refresh
      const invitesRes = await fetch(`/api/teams/${teamId}/invitations`).then(r => r.json())
      setInvitations(invitesRes.invitations || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!window.confirm('Remove this member from the team?')) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to remove member')
      setMembers(members.filter(m => m.user_id !== userId))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleChangeRole(userId: string, newRole: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to change role')
      setMembers(members.map(m => (m.user_id === userId ? { ...m, role: newRole } : m)))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!window.confirm('Cancel this invitation?')) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/teams/invitations/${inviteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to cancel invitation')
      setInvitations(invitations.filter(i => i.id !== inviteId))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Analytics</CardTitle>
          <CardDescription>View analytics and reports for your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/settings/team/analytics">View Team Analytics</Link>
          </Button>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your team members and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setInviteDialog(true)} className="mb-4" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Invite Member
          </Button>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      {member.profiles?.full_name || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      {member.profiles?.email || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={val => handleChangeRole(member.user_id, val)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveMember(member.user_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Invitations that have not yet been accepted.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : invitations.length === 0 ? (
            <div className="text-gray-500">No pending invitations.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map(invite => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>{invite.role}</TableCell>
                    <TableCell>
                      {invite.invited_by || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              type="email"
              required
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}{' '}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
