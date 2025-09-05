/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Shield,
  Pencil,
  Trash2,
  UserPlus,
  CheckSquare,
  Square,
  Download,
  Info,
  Plus,
  Users as UsersIcon,
  X as XIcon,
  Copy,
  Key,
  Trash,
  BarChart3,
  PieChart,
  Edit,
  FileText,
  Eye,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Pie,
} from 'recharts'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'
import { Permission } from '@/lib/rbac/types'

const ADMIN_ROLES = ['admin', 'super_admin']

const ALL_PERMISSIONS: Permission[] = [
  'create:asset',
  'read:asset',
  'update:asset',
  'delete:asset',
  'manage:users',
  'manage:roles',
  'manage:tenants',
  'view:analytics',
  'manage:billing',
  'manage:settings',
]

export default function AdminPanelPage() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [tab, setTab] = useState('users')
  const [data, setData] = useState<any>({ users: [], assets: [], logs: [], teams: [] })
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; role: any | null }>({
    open: false,
    role: null,
  })
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; user: any | null }>({
    open: false,
    user: null,
  })
  const [resetDialog, setResetDialog] = useState<{ open: boolean; user: any | null }>({
    open: false,
    user: null,
  })
  const { toast } = useToast()
  const [assetSearch, setAssetSearch] = useState('')
  const [editAssetDialog, setEditAssetDialog] = useState<{ open: boolean; asset: any | null }>({
    open: false,
    asset: null,
  })
  const [deleteAssetDialog, setDeleteAssetDialog] = useState<{ open: boolean; asset: any | null }>({
    open: false,
    asset: null,
  })
  const [assignAssetDialog, setAssignAssetDialog] = useState<{ open: boolean; asset: any | null }>({
    open: false,
    asset: null,
  })
  const [bulkSelected, setBulkSelected] = useState<string[]>([])
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)
  const [assignUserEmail, setAssignUserEmail] = useState('')
  const [editAssetName, setEditAssetName] = useState('')
  const [editAssetCategory, setEditAssetCategory] = useState('')
  const [editAssetStatus, setEditAssetStatus] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const [logDetailDialog, setLogDetailDialog] = useState<{ open: boolean; log: any | null }>({
    open: false,
    log: null,
  })
  const [logPage, setLogPage] = useState(1)
  const LOGS_PER_PAGE = 10
  const [teamSearch, setTeamSearch] = useState('')
  const [addTeamDialog, setAddTeamDialog] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [removeTeamDialog, setRemoveTeamDialog] = useState<{ open: boolean; team: any | null }>({
    open: false,
    team: null,
  })
  const [teamMembersDialog, setTeamMembersDialog] = useState<{ open: boolean; team: any | null }>({
    open: false,
    team: null,
  })
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRoleDialog, setMemberRoleDialog] = useState<{
    open: boolean
    member: any | null
    team: any | null
  }>({ open: false, member: null, team: null })
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [apiTab, setApiTab] = useState(false)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [apiKeyDialog, setApiKeyDialog] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [revokeApiKeyDialog, setRevokeApiKeyDialog] = useState<{ open: boolean; key: any | null }>({
    open: false,
    key: null,
  })
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [depreciationEditDialog, setDepreciationEditDialog] = useState<{
    open: boolean
    asset: any | null
  }>({ open: false, asset: null })
  const [depValue, setDepValue] = useState('')
  const [depDate, setDepDate] = useState('')
  const [depMethod, setDepMethod] = useState('straight_line')
  const [depYears, setDepYears] = useState('')
  const [depSalvage, setDepSalvage] = useState('')
  const [chartDialog, setChartDialog] = useState<{ open: boolean; asset: any | null }>({
    open: false,
    asset: null,
  })
  const [customReports, setCustomReports] = useState<any[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState<string | null>(null)
  const [reportDialog, setReportDialog] = useState(false)
  const [reportName, setReportName] = useState('')
  const [reportSource, setReportSource] = useState<keyof typeof sources>('assets')
  const [reportFields, setReportFields] = useState<string[]>([])
  const [reportFilter, setReportFilter] = useState('')
  const [reportAgg, setReportAgg] = useState('')
  const [reportChart, setReportChart] = useState('table')
  const [runReport, setRunReport] = useState<any | null>(null)
  const [editReportIdx, setEditReportIdx] = useState<number | null>(null)
  const [reportFilters, setReportFilters] = useState<
    { field: string; op: string; value: string }[]
  >([])
  const [reportAggType, setReportAggType] = useState('')
  const [reportAggField, setReportAggField] = useState('')
  const [reportGroupBy, setReportGroupBy] = useState('')
  const [roleSearch, setRoleSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [changeRoleDialog, setChangeRoleDialog] = useState<{ open: boolean; user: any | null }>({
    open: false,
    user: null,
  })
  const [newRole, setNewRole] = useState<string>('')
  const [roleUpdating, setRoleUpdating] = useState(false)
  const [viewPermsRole, setViewPermsRole] = useState<string>('')
  const [users, setUsers] = useState<any[]>(data.users || [])
  const [editPermsRole, setEditPermsRole] = useState<string>('')
  const [editPerms, setEditPerms] = useState<Permission[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [roleName, setRoleName] = useState('')
  const [rolePerms, setRolePerms] = useState<Permission[]>([])
  const [roleSaveLoading, setRoleSaveLoading] = useState(false)
  const [deleteRoleDialog, setDeleteRoleDialog] = useState<{ open: boolean; role: any | null }>({
    open: false,
    role: null,
  })
  // Add a separate userDialog state for user dialogs
  const [userDialog, setUserDialog] = useState<{ open: boolean; user: any | null }>({
    open: false,
    user: null,
  })
  // Add state for bulk update dialog and fields
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false)
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState('')
  const [bulkUpdateCategory, setBulkUpdateCategory] = useState('')
  const [bulkUpdateLocation, setBulkUpdateLocation] = useState('')
  const [undoBulkUpdateData, setUndoBulkUpdateData] = useState<any[]>([])
  const [undoBulkUpdateIds, setUndoBulkUpdateIds] = useState<string[]>([])

  // Data sources and fields
  const sources: {
    [key: string]: { label: string; fields: string[] }
  } = {
    assets: {
      label: 'Assets',
      fields: ['name', 'category', 'status', 'purchase_value', 'created_at'],
    },
    users: { label: 'Users', fields: ['email', 'full_name', 'role', 'created_at'] },
    teams: { label: 'Teams', fields: ['name', 'created_by', 'created_at'] },
    logs: { label: 'Logs', fields: ['action', 'performed_by', 'created_at'] },
  }

  useEffect(() => {
    if (!user) return
    // Fetch profile to get role
    const fetchProfile = async () => {
      setDataLoading(true)
      setError(null)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, tenant_id')
          .eq('id', user.id)
          .single()
        if (error) throw error
        setProfile(profile)
      } catch (err: any) {
        setError('Failed to load profile')
      } finally {
        setDataLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  useEffect(() => {
    if (!profile || !ADMIN_ROLES.includes(profile.role)) return
    // Fetch all admin data
    const fetchData = async () => {
      setDataLoading(true)
      setError(null)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        // Users
        const { data: users } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, created_at')
          .order('created_at', { ascending: false })
        // Assets
        const { data: assets } = await supabase
          .from('assets')
          .select('asset_id, name, category, status, created_at')
          .order('created_at', { ascending: false })
        // Audit logs
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('id, action, performed_by, created_at')
          .order('created_at', { ascending: false })
        // Teams
        const { data: teams } = await supabase
          .from('teams')
          .select('id, name, created_by, created_at')
          .order('created_at', { ascending: false })
        setData({ users: users || [], assets: assets || [], logs: logs || [], teams: teams || [] })
      } catch (err: any) {
        setError('Failed to load admin data')
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [profile])

  // Fetch API keys when API tab is selected
  useEffect(() => {
    if (tab === 'apikeys') {
      ;(async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: keys } = await supabase
            .from('api_keys')
            .select('id, name, created_at, last_used_at, revoked, key')
          setApiKeys(keys || [])
        } catch {
          toast({ title: 'Error', description: 'Failed to load API keys', variant: 'destructive' })
        }
      })()
    }
  }, [tab, toast])

  // Filtered users
  const filteredUsers = data.users.filter((u: any) => {
    const q = userSearch.toLowerCase()
    return u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q)
  })

  // Filtered assets
  const filteredAssets = data.assets.filter((a: any) => {
    const q = assetSearch.toLowerCase()
    return (
      a.asset_id?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q)
    )
  })

  // Filtered and paginated logs
  const filteredLogs = data.logs.filter((l: any) => {
    const q = logSearch.toLowerCase()
    return (
      l.action?.toLowerCase().includes(q) ||
      l.performed_by?.toLowerCase().includes(q) ||
      l.created_at?.slice(0, 10).includes(q)
    )
  })
  const paginatedLogs = filteredLogs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE)
  const totalLogPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE)

  // Analytics widgets
  const assetsThisMonth = data.assets.filter((a: any) => {
    if (!a.created_at) return false
    const d = new Date(a.created_at)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  // Most active user (by audit logs)
  const userActivity: Record<string, number> = {}
  data.logs.forEach((l: any) => {
    if (l.performed_by) userActivity[l.performed_by] = (userActivity[l.performed_by] || 0) + 1
  })
  const mostActiveUserId = Object.entries(userActivity).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  )[0]?.[0]
  const mostActiveUser = data.users.find((u: any) => u.id === mostActiveUserId)

  // Quick stats
  const stats = [
    { label: 'Users', value: data.users.length },
    { label: 'Assets', value: data.assets.length },
    { label: 'Teams', value: data.teams.length },
    { label: 'Logs', value: data.logs.length },
  ]

  // User actions
  const handleInvite = async () => {
    setInviteLoading(true)
    try {
      // Simulate invite (replace with real API call)
      await new Promise(res => setTimeout(res, 1000))
      toast({ title: 'Invite sent', description: `Invitation sent to ${inviteEmail}` })
      setInviteDialogOpen(false)
      setInviteEmail('')
    } catch {
      toast({ title: 'Error', description: 'Failed to send invite', variant: 'destructive' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleChangeRole = async (userObj: any, newRole: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('profiles').update({ role: newRole }).eq('id', userObj.id)
      toast({ title: 'Role updated', description: `${userObj.email} is now ${newRole}` })
      setUserDialog({ open: false, user: userDialog.user })
      // Refresh users
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' })
    }
  }

  const handleDeactivate = async (userObj: any, deactivate: boolean) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('profiles').update({ deactivated: deactivate }).eq('id', userObj.id)
      toast({
        title: deactivate ? 'User deactivated' : 'User reactivated',
        description: userObj.email,
      })
      setUserDialog({ open: false, user: userDialog.user })
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' })
    }
  }

  const handleResetPassword = async (userObj: any) => {
    try {
      // Simulate reset (replace with real API call)
      await new Promise(res => setTimeout(res, 1000))
      toast({ title: 'Password reset email sent', description: userObj.email })
      setUserDialog({ open: false, user: userDialog.user })
    } catch {
      toast({ title: 'Error', description: 'Failed to send reset email', variant: 'destructive' })
    }
  }

  // Asset actions
  const handleEditAsset = (asset: any) => {
    setEditAssetName(asset.name)
    setEditAssetCategory(asset.category)
    setEditAssetStatus(asset.status)
    setEditAssetDialog({ open: true, asset })
  }
  const handleSaveAsset = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase
        .from('assets')
        .update({ name: editAssetName, category: editAssetCategory, status: editAssetStatus })
        .eq('asset_id', editAssetDialog.asset.asset_id)
      toast({ title: 'Asset updated', description: editAssetName })
      setEditAssetDialog({ open: false, asset: null })
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to update asset', variant: 'destructive' })
    }
  }
  const handleDeleteAsset = async (asset: any) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('assets').delete().eq('asset_id', asset.asset_id)
      toast({ title: 'Asset deleted', description: asset.name })
      setDeleteAssetDialog({ open: false, asset: null })
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete asset', variant: 'destructive' })
    }
  }
  const handleAssignAsset = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      // Find user by email
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', assignUserEmail)
        .single()
      if (!user) throw new Error('User not found')
      await supabase
        .from('assets')
        .update({ assignee_id: user.id })
        .eq('asset_id', assignAssetDialog.asset.asset_id)
      toast({ title: 'Asset assigned', description: `Assigned to ${assignUserEmail}` })
      setAssignAssetDialog({ open: false, asset: null })
      setAssignUserEmail('')
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to assign asset', variant: 'destructive' })
    }
  }
  const handleBulkSelect = (assetId: string) => {
    setBulkSelected(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    )
  }
  const handleBulkDelete = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('assets').delete().in('asset_id', bulkSelected)
      toast({ title: 'Assets deleted', description: `${bulkSelected.length} assets deleted` })
      setBulkDeleteDialog(false)
      setBulkSelected([])
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete assets', variant: 'destructive' })
    }
  }

  // Export logs to CSV
  const handleExportLogs = () => {
    const headers = ['Action', 'By', 'Date']
    const rows = filteredLogs.map((l: any) => [
      l.action,
      l.performed_by,
      l.created_at?.slice(0, 10),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-logs.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Logs exported', description: 'Audit logs exported to CSV' })
  }

  // Filtered teams
  const filteredTeams = data.teams.filter((t: any) => {
    const q = teamSearch.toLowerCase()
    return t.name?.toLowerCase().includes(q)
  })

  // Add team
  const handleAddTeam = async () => {
    if (!user) return
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('teams').insert({ name: newTeamName, created_by: user.id })
      toast({ title: 'Team created', description: newTeamName })
      setAddTeamDialog(false)
      setNewTeamName('')
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to create team', variant: 'destructive' })
    }
  }
  // Remove team
  const handleRemoveTeam = async (team: any) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('teams').delete().eq('id', team.id)
      toast({ title: 'Team removed', description: team.name })
      setRemoveTeamDialog({ open: false, team: null })
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to remove team', variant: 'destructive' })
    }
  }
  // Open team members dialog
  const openTeamMembers = async (team: any) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: members } = await supabase
        .from('team_members')
        .select('id, user_id, role, joined_at, profiles:profiles(full_name, email)')
        .eq('team_id', team.id)
      setTeamMembers(members || [])
      setTeamMembersDialog({ open: true, team })
    } catch {
      toast({ title: 'Error', description: 'Failed to load team members', variant: 'destructive' })
    }
  }
  // Add member
  const handleAddMember = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      // Find user by email
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberEmail)
        .single()
      if (!userProfile) throw new Error('User not found')
      await supabase
        .from('team_members')
        .insert({ team_id: teamMembersDialog.team.id, user_id: userProfile.id, role: 'member' })
      toast({ title: 'Member added', description: memberEmail })
      setMemberEmail('')
      openTeamMembers(teamMembersDialog.team)
    } catch {
      toast({ title: 'Error', description: 'Failed to add member', variant: 'destructive' })
    }
  }
  // Remove member
  const handleRemoveMember = async (member: any) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('team_members').delete().eq('id', member.id)
      toast({ title: 'Member removed', description: member.profiles?.email })
      openTeamMembers(teamMembersDialog.team)
    } catch {
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' })
    }
  }
  // Change member role
  const handleChangeMemberRole = async (member: any, newRole: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('team_members').update({ role: newRole }).eq('id', member.id)
      toast({ title: 'Role updated', description: `${member.profiles?.email} is now ${newRole}` })
      setMemberRoleDialog({ open: false, member: null, team: null })
      openTeamMembers(teamMembersDialog.team)
    } catch {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' })
    }
  }

  // API Key actions
  const handleCreateApiKey = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: key } = await supabase
        .from('api_keys')
        .insert({ name: newApiKeyName })
        .select()
        .single()
      toast({ title: 'API Key created', description: key?.key })
      setApiKeyDialog(false)
      setNewApiKeyName('')
      setApiKeys([key, ...apiKeys])
    } catch {
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' })
    }
  }
  const handleRevokeApiKey = async (key: any) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('api_keys').update({ revoked: true }).eq('id', key.id)
      toast({ title: 'API Key revoked', description: key.name })
      setRevokeApiKeyDialog({ open: false, key: null })
      setApiKeys(apiKeys.map(k => (k.id === key.id ? { ...k, revoked: true } : k)))
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke API key', variant: 'destructive' })
    }
  }
  const handleCopyApiKey = (key: any) => {
    navigator.clipboard.writeText(key.key)
    setCopiedKeyId(key.id)
    toast({ title: 'Copied', description: 'API key copied to clipboard' })
    setTimeout(() => setCopiedKeyId(null), 1500)
  }

  // Depreciation calculation
  const getBookValue = (asset: any) => {
    try {
      // Dynamic import for depreciation calculation
      const calculateBookValue = (params: any) => {
        // Simplified calculation for now
        const { purchase_value, purchase_date, depreciation_period_years, salvage_value } = params
        const yearsElapsed =
          (new Date().getTime() - new Date(purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365)
        const annualDepreciation =
          (purchase_value - (salvage_value || 0)) / depreciation_period_years
        return Math.max(purchase_value - annualDepreciation * yearsElapsed, salvage_value || 0)
      }
      return calculateBookValue({
        purchase_value: Number(asset.purchase_value),
        purchase_date: asset.purchase_date,
        depreciation_method: asset.depreciation_method || 'straight_line',
        depreciation_period_years: Number(asset.depreciation_period_years),
        salvage_value: Number(asset.salvage_value) || 0,
      })
    } catch {
      return '-'
    }
  }

  // Open edit dialog
  const openDepreciationEdit = (asset: any) => {
    setDepValue(asset.purchase_value || '')
    setDepDate(asset.purchase_date || '')
    setDepMethod(asset.depreciation_method || 'straight_line')
    setDepYears(asset.depreciation_period_years || '')
    setDepSalvage(asset.salvage_value || '')
    setDepreciationEditDialog({ open: true, asset })
  }
  // Save depreciation params
  const handleSaveDepreciation = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase
        .from('assets')
        .update({
          purchase_value: Number(depValue),
          purchase_date: depDate,
          depreciation_method: depMethod,
          depreciation_period_years: Number(depYears),
          salvage_value: Number(depSalvage),
        })
        .eq('asset_id', depreciationEditDialog.asset.asset_id)
      if (error) {
        console.error('Depreciation update error:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to update depreciation',
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Depreciation updated', description: depreciationEditDialog.asset.name })
      setDepreciationEditDialog({ open: false, asset: null })
      setProfile({ ...profile })
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' })
    }
  }

  // Generate value-over-time data for chart
  const getValueOverTime = (asset: any) => {
    try {
      // Use the same simplified calculation
      const calculateBookValue = (params: any) => {
        const { purchase_value, purchase_date, depreciation_period_years, salvage_value } = params
        const yearsElapsed =
          (new Date(params.current_date || new Date()).getTime() -
            new Date(purchase_date).getTime()) /
          (1000 * 60 * 60 * 24 * 365)
        const annualDepreciation =
          (purchase_value - (salvage_value || 0)) / depreciation_period_years
        return Math.max(purchase_value - annualDepreciation * yearsElapsed, salvage_value || 0)
      }
      if (!asset.purchase_date || !asset.purchase_value || !asset.depreciation_period_years)
        return []
      const start = new Date(asset.purchase_date)
      const years = Number(asset.depreciation_period_years)
      const data = []
      for (let i = 0; i <= years; i++) {
        const date = new Date(start)
        date.setFullYear(date.getFullYear() + i)
        data.push({
          year: start.getFullYear() + i,
          value: calculateBookValue(
            {
              purchase_value: Number(asset.purchase_value),
              purchase_date: asset.purchase_date,
              depreciation_method: asset.depreciation_method || 'straight_line',
              depreciation_period_years: Number(asset.depreciation_period_years),
              salvage_value: Number(asset.salvage_value) || 0,
            },
            i
          ),
        })
      }
      return data
    } catch {
      return []
    }
  }

  // Enhanced getReportData
  const getReportData = (report: any) => {
    let rows = []
    if (report.source === 'assets') rows = data.assets
    if (report.source === 'users') rows = data.users
    if (report.source === 'teams') rows = data.teams
    if (report.source === 'logs') rows = data.logs
    // Advanced filters
    if (report.filters && report.filters.length > 0) {
      rows = rows.filter((row: any) =>
        report.filters.every((f: any) => {
          const v = row[f.field]
          if (f.op === '=') return String(v) === f.value
          if (f.op === 'contains') return String(v).toLowerCase().includes(f.value.toLowerCase())
          if (f.op === '>') return Number(v) > Number(f.value)
          if (f.op === '<') return Number(v) < Number(f.value)
          if (f.op === '>=') return Number(v) >= Number(f.value)
          if (f.op === '<=') return Number(v) <= Number(f.value)
          if (f.op === 'between') {
            const [min, max] = f.value.split(',')
            return Number(v) >= Number(min) && Number(v) <= Number(max)
          }
          return true
        })
      )
    }
    // Fields
    if (report.fields && report.fields.length > 0) {
      rows = rows.map((row: any) => {
        const obj: any = {}
        report.fields.forEach((f: string) => (obj[f] = row[f]))
        return obj
      })
    }
    // Group by
    if (report.groupBy) {
      const grouped: Record<string, any[]> = {}
      rows.forEach((row: any) => {
        const key = row[report.groupBy]
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(row)
      })
      // Aggregation on group
      if (report.aggType && report.aggField) {
        const aggRows = Object.entries(grouped).map(([k, group]) => {
          let val = null
          if (report.aggType === 'count') val = group.length
          if (report.aggType === 'sum')
            val = group.reduce((a: number, b: any) => a + Number(b[report.aggField]), 0)
          if (report.aggType === 'avg')
            val =
              group.reduce((a: number, b: any) => a + Number(b[report.aggField]), 0) / group.length
          if (report.aggType === 'min')
            val = Math.min(...group.map((b: any) => Number(b[report.aggField])))
          if (report.aggType === 'max')
            val = Math.max(...group.map((b: any) => Number(b[report.aggField])))
          return { [report.groupBy]: k, [report.aggField]: val }
        })
        return aggRows
      }
      // No aggregation, just group
      return Object.entries(grouped).map(([k, group]) => ({
        [report.groupBy]: k,
        count: group.length,
      }))
    }
    // Aggregation (if not grouped)
    if (report.aggType && report.aggField) {
      let val = null
      if (report.aggType === 'count') val = rows.length
      if (report.aggType === 'sum')
        val = rows.reduce((a: number, b: any) => a + Number(b[report.aggField]), 0)
      if (report.aggType === 'avg')
        val = rows.reduce((a: number, b: any) => a + Number(b[report.aggField]), 0) / rows.length
      if (report.aggType === 'min')
        val = Math.min(...rows.map((b: any) => Number(b[report.aggField])))
      if (report.aggType === 'max')
        val = Math.max(...rows.map((b: any) => Number(b[report.aggField])))
      return [{ [report.aggField]: val }]
    }
    return rows
  }

  // Export to CSV
  const handleExportReport = (rows: any[]) => {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h]).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'custom-report.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Report exported', description: 'CSV downloaded' })
  }

  // Fetch reports from backend
  React.useEffect(() => {
    setReportsLoading(true)
    fetch('/api/custom-reports')
      .then(res => res.json())
      .then(res => {
        setCustomReports(res.data || [])
        setReportsError(null)
      })
      .catch(() => setReportsError('Failed to load reports'))
      .finally(() => setReportsLoading(false))
  }, [])

  // Save report to backend
  const saveReport = async (report: any, editIdx: number | null) => {
    try {
      setReportsLoading(true)
      if (editIdx !== null && customReports[editIdx]?.id) {
        // Update
        const res = await fetch('/api/custom-reports', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: customReports[editIdx].id,
            name: report.name,
            config: report,
          }),
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setCustomReports(
          customReports.map((r, i) => (i === editIdx ? { ...json.data, config: report } : r))
        )
        toast({ title: 'Report updated' })
      } else {
        // Create
        const res = await fetch('/api/custom-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: report.name, config: report }),
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setCustomReports([json.data, ...customReports])
        toast({ title: 'Report created' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setReportsLoading(false)
    }
  }

  // Delete report from backend
  const deleteReport = async (idx: number) => {
    try {
      setReportsLoading(true)
      const id = customReports[idx].id
      const res = await fetch('/api/custom-reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setCustomReports(customReports.filter((_, i) => i !== idx))
      toast({ title: 'Report deleted' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setReportsLoading(false)
    }
  }

  // Fetch roles on mount
  useEffect(() => {
    setRolesLoading(true)
    fetch('/api/roles')
      .then(res => res.json())
      .then(res => {
        setRoles(res.data || [])
        setRolesError(null)
      })
      .catch(() => setRolesError('Failed to load roles'))
      .finally(() => setRolesLoading(false))
  }, [])

  // Create or update role
  const saveRole = async () => {
    setRoleSaveLoading(true)
    const method = roleDialog.role ? 'PUT' : 'POST'
    const body = roleDialog.role
      ? { id: roleDialog.role.id, name: roleName, permissions: rolePerms }
      : { name: roleName, permissions: rolePerms }
    const res = await fetch('/api/roles', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setRoleSaveLoading(false)
    if (json.error) {
      toast({ title: 'Error', description: json.error, variant: 'destructive' })
      return
    }
    if (roleDialog.role) {
      setRoles(roles.map(r => (r.id === json.data.id ? json.data : r)))
      toast({ title: 'Role updated' })
    } else {
      setRoles([json.data, ...roles])
      toast({ title: 'Role created' })
    }
    setRoleDialog({ open: false, role: null })
  }

  // Delete role
  const deleteRole = async () => {
    if (!deleteRoleDialog.role) return
    const res = await fetch('/api/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteRoleDialog.role.id }),
    })
    const json = await res.json()
    if (json.error) {
      toast({ title: 'Error', description: json.error, variant: 'destructive' })
      return
    }
    setRoles(roles.filter(r => r.id !== deleteRoleDialog.role.id))
    toast({ title: 'Role deleted' })
    setDeleteRoleDialog({ open: false, role: null })
  }

  // Bulk update handler
  const handleBulkUpdate = async () => {
    try {
      // Fetch previous asset data for undo
      const res = await fetch('/api/assets/bulk-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: bulkSelected }),
      })
      const prevData = await res.json()
      setUndoBulkUpdateData(prevData.assets || [])
      setUndoBulkUpdateIds(bulkSelected)
      // Prepare update fields
      const updateFields: any = {}
      if (bulkUpdateStatus) updateFields.status = bulkUpdateStatus
      if (bulkUpdateCategory) updateFields.category = bulkUpdateCategory
      if (bulkUpdateLocation) updateFields.location = bulkUpdateLocation
      // Update assets
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('assets').update(updateFields).in('asset_id', bulkSelected)
      toast({
        title: 'Assets updated',
        description:
          `${bulkSelected.length} assets updated` +
          (Object.keys(updateFields).length ? ` (${Object.keys(updateFields).join(', ')})` : ''),
        action: (
          <Button variant="outline" onClick={handleUndoBulkUpdate}>
            Undo
          </Button>
        ),
      })
      setBulkUpdateDialog(false)
      setBulkSelected([])
      setBulkUpdateStatus('')
      setBulkUpdateCategory('')
      setBulkUpdateLocation('')
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to update assets', variant: 'destructive' })
    }
  }
  // Undo bulk update handler
  const handleUndoBulkUpdate = async () => {
    try {
      await fetch('/api/assets/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: undoBulkUpdateData }),
      })
      toast({
        title: 'Undo successful',
        description: `${undoBulkUpdateIds.length} assets restored`,
      })
      setUndoBulkUpdateData([])
      setUndoBulkUpdateIds([])
      setProfile({ ...profile })
    } catch {
      toast({ title: 'Error', description: 'Failed to undo update', variant: 'destructive' })
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  if (!ADMIN_ROLES.includes(profile.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert variant="destructive">
          <Shield className="h-5 w-5 mr-2" />
          <AlertDescription>
            <b>Unauthorized:</b> You do not have permission to access the Admin Panel.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-5xl mb-6">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Users', value: data.users.length },
              { label: 'Assets', value: data.assets.length },
              { label: 'Teams', value: data.teams.length },
              { label: 'Logs', value: data.logs.length },
              { label: 'Assets This Month', value: assetsThisMonth },
              mostActiveUser && { label: 'Most Active User', value: mostActiveUser.email },
            ]
              .filter(Boolean)
              .map((s, i) => (
                <div key={s.label + i} className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-gray-600">{s.label}</div>
                </div>
              ))}
          </div>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="logs">Audit Logs</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="apikeys">API Keys</TabsTrigger>
              <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
              <TabsTrigger value="customreports">Custom Reports</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <Input
                  placeholder="Search users by email or name..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={() => setInviteDialogOpen(true)} variant="outline">
                  Invite User
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.full_name}</TableCell>
                      <TableCell>
                        <select
                          value={u.role_id || ''}
                          onChange={async e => {
                            const newRoleId = e.target.value
                            // Update user role_id in backend
                            await fetch('/api/users', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: u.id, role_id: newRoleId }),
                            })
                            setUsers(
                              users.map(user =>
                                user.id === u.id ? { ...user, role_id: newRoleId } : user
                              )
                            )
                            toast({ title: 'User role updated' })
                          }}
                        >
                          <option value="">Select role</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>{u.deactivated ? 'Deactivated' : 'Active'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setUserDialog({ open: true, user: u })}
                        >
                          Change Role
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-2"
                          onClick={() => setDeactivateDialog({ open: true, user: u })}
                        >
                          {u.deactivated ? 'Reactivate' : 'Deactivate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-2"
                          onClick={() => setResetDialog({ open: true, user: u })}
                        >
                          Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Invite User Dialog */}
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                  <DialogFooter>
                    <Button onClick={handleInvite} disabled={!inviteEmail || inviteLoading}>
                      {inviteLoading ? (
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
                        </span>
                      ) : (
                        'Send Invite'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Change Role Dialog */}
              <Dialog
                open={userDialog.open}
                onOpenChange={open => setUserDialog({ open, user: userDialog.user })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change User Role</DialogTitle>
                  </DialogHeader>
                  <div>
                    Change role for <b>{userDialog.user?.email}</b>:
                  </div>
                  <div className="flex gap-2 mt-2">
                    {['user', 'manager', 'admin', 'super_admin'].map(r => (
                      <Button
                        key={r}
                        variant={userDialog.user?.role === r ? 'default' : 'outline'}
                        onClick={() => handleChangeRole(userDialog.user, r)}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              {/* Deactivate/Reactivate Dialog */}
              <Dialog
                open={deactivateDialog.open}
                onOpenChange={open => setDeactivateDialog({ open, user: deactivateDialog.user })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {deactivateDialog.user?.deactivated ? 'Reactivate' : 'Deactivate'} User
                    </DialogTitle>
                  </DialogHeader>
                  <div>
                    Are you sure you want to{' '}
                    {deactivateDialog.user?.deactivated ? 'reactivate' : 'deactivate'}{' '}
                    <b>{deactivateDialog.user?.email}</b>?
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleDeactivate(deactivateDialog.user, !deactivateDialog.user?.deactivated)
                      }
                    >
                      Yes, {deactivateDialog.user?.deactivated ? 'Reactivate' : 'Deactivate'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Reset Password Dialog */}
              <Dialog
                open={resetDialog.open}
                onOpenChange={open => setResetDialog({ open, user: resetDialog.user })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                  </DialogHeader>
                  <div>
                    Send password reset email to <b>{resetDialog.user?.email}</b>?
                  </div>
                  <DialogFooter>
                    <Button onClick={() => handleResetPassword(resetDialog.user)}>
                      Send Reset Email
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="assets">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <Input
                  placeholder="Search assets by name, ID, or category..."
                  value={assetSearch}
                  onChange={e => setAssetSearch(e.target.value)}
                  className="max-w-xs"
                />
                {bulkSelected.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setBulkUpdateDialog(true)}>
                      Update Selected ({bulkSelected.length})
                    </Button>
                    <Button variant="destructive" onClick={() => setBulkDeleteDialog(true)}>
                      Delete Selected ({bulkSelected.length})
                    </Button>
                  </div>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <CheckSquare className="inline h-4 w-4" />
                    </TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((a: any) => (
                    <TableRow key={a.asset_id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBulkSelect(a.asset_id)}
                        >
                          {bulkSelected.includes(a.asset_id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>{a.asset_id}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.category}</TableCell>
                      <TableCell>{a.status}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(`/asset/${a.asset_id}`, '_blank')}
                          title="Preview"
                          aria-label="Preview asset"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-2"
                          onClick={() => handleEditAsset(a)}
                          title="Edit"
                          aria-label="Edit asset"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-2"
                          onClick={() => setAssignAssetDialog({ open: true, asset: a })}
                          title="Assign"
                          aria-label="Assign asset"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="ml-2"
                          onClick={() => setDeleteAssetDialog({ open: true, asset: a })}
                          title="Delete"
                          aria-label="Delete asset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Edit Asset Dialog */}
              <Dialog
                open={editAssetDialog.open}
                onOpenChange={open => setEditAssetDialog({ open, asset: editAssetDialog.asset })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Asset</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Name"
                    value={editAssetName}
                    onChange={e => setEditAssetName(e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Category"
                    value={editAssetCategory}
                    onChange={e => setEditAssetCategory(e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Status"
                    value={editAssetStatus}
                    onChange={e => setEditAssetStatus(e.target.value)}
                    className="mb-2"
                  />
                  <DialogFooter>
                    <Button onClick={handleSaveAsset}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Delete Asset Dialog */}
              <Dialog
                open={deleteAssetDialog.open}
                onOpenChange={open =>
                  setDeleteAssetDialog({ open, asset: deleteAssetDialog.asset })
                }
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Asset</DialogTitle>
                  </DialogHeader>
                  <div>
                    Are you sure you want to delete <b>{deleteAssetDialog.asset?.name}</b>?
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteAsset(deleteAssetDialog.asset)}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Assign Asset Dialog */}
              <Dialog
                open={assignAssetDialog.open}
                onOpenChange={open =>
                  setAssignAssetDialog({ open, asset: assignAssetDialog.asset })
                }
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Asset</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="User email"
                    value={assignUserEmail}
                    onChange={e => setAssignUserEmail(e.target.value)}
                  />
                  <DialogFooter>
                    <Button onClick={handleAssignAsset}>Assign</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Bulk Delete Dialog */}
              <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Selected Assets</DialogTitle>
                  </DialogHeader>
                  <div>
                    Are you sure you want to delete <b>{bulkSelected.length}</b> assets?
                  </div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={handleBulkDelete}>
                      Delete All
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Bulk Update Dialog */}
              <Dialog open={bulkUpdateDialog} onOpenChange={setBulkUpdateDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Selected Assets</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Status"
                      value={bulkUpdateStatus}
                      onChange={e => setBulkUpdateStatus(e.target.value)}
                      className="mb-2"
                    />
                    <Input
                      placeholder="Category"
                      value={bulkUpdateCategory}
                      onChange={e => setBulkUpdateCategory(e.target.value)}
                      className="mb-2"
                    />
                    <Input
                      placeholder="Location"
                      value={bulkUpdateLocation}
                      onChange={e => setBulkUpdateLocation(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleBulkUpdate}>Update All</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="logs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <Input
                  placeholder="Search logs by action, user, or date..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={handleExportLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.action}</TableCell>
                      <TableCell>{l.performed_by}</TableCell>
                      <TableCell>{l.created_at?.slice(0, 10)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setLogDetailDialog({ open: true, log: l })}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex justify-end items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logPage === 1}
                  onClick={() => setLogPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <span className="text-xs">
                  Page {logPage} of {totalLogPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logPage === totalLogPages || totalLogPages === 0}
                  onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                >
                  Next
                </Button>
              </div>
              {/* Log Detail Dialog */}
              <Dialog
                open={logDetailDialog.open}
                onOpenChange={open => setLogDetailDialog({ open, log: logDetailDialog.log })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Details</DialogTitle>
                  </DialogHeader>
                  <div className="mb-2">
                    <b>Action:</b> {logDetailDialog.log?.action}
                  </div>
                  <div className="mb-2">
                    <b>By:</b> {logDetailDialog.log?.performed_by}
                  </div>
                  <div className="mb-2">
                    <b>Date:</b> {logDetailDialog.log?.created_at?.slice(0, 10)}
                  </div>
                  {logDetailDialog.log && (
                    <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">
                      {JSON.stringify(logDetailDialog.log, null, 2)}
                    </pre>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="teams">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <Input
                  placeholder="Search teams by name..."
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={() => setAddTeamDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.created_by}</TableCell>
                      <TableCell>{t.created_at?.slice(0, 10)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="secondary" onClick={() => openTeamMembers(t)}>
                          <UsersIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRemoveTeamDialog({ open: true, team: t })}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Add Team Dialog */}
              <Dialog open={addTeamDialog} onOpenChange={setAddTeamDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Team name"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                  />
                  <DialogFooter>
                    <Button onClick={handleAddTeam} disabled={!newTeamName}>
                      Add
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Remove Team Dialog */}
              <Dialog
                open={removeTeamDialog.open}
                onOpenChange={open => setRemoveTeamDialog({ open, team: removeTeamDialog.team })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove Team</DialogTitle>
                  </DialogHeader>
                  <div>
                    Are you sure you want to remove <b>{removeTeamDialog.team?.name}</b>?
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveTeam(removeTeamDialog.team)}
                    >
                      Remove
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Team Members Dialog */}
              <Dialog
                open={teamMembersDialog.open}
                onOpenChange={open => setTeamMembersDialog({ open, team: teamMembersDialog.team })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Team Members</DialogTitle>
                  </DialogHeader>
                  <div className="mb-2 flex gap-2">
                    <Input
                      placeholder="User email"
                      value={memberEmail}
                      onChange={e => setMemberEmail(e.target.value)}
                    />
                    <Button onClick={handleAddMember} disabled={!memberEmail}>
                      Add
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.profiles?.full_name}</TableCell>
                          <TableCell>{m.profiles?.email}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setMemberRoleDialog({
                                  open: true,
                                  member: m,
                                  team: teamMembersDialog.team,
                                })
                              }
                            >
                              {m.role}
                            </Button>
                          </TableCell>
                          <TableCell>{m.joined_at?.slice(0, 10)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveMember(m)}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DialogContent>
              </Dialog>
              {/* Change Member Role Dialog */}
              <Dialog
                open={memberRoleDialog.open}
                onOpenChange={open =>
                  setMemberRoleDialog({
                    open,
                    member: memberRoleDialog.member,
                    team: memberRoleDialog.team,
                  })
                }
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Member Role</DialogTitle>
                  </DialogHeader>
                  <div>
                    Change role for <b>{memberRoleDialog.member?.profiles?.email}</b>:
                  </div>
                  <div className="flex gap-2 mt-2">
                    {['member', 'admin'].map(r => (
                      <Button
                        key={r}
                        variant={memberRoleDialog.member?.role === r ? 'default' : 'outline'}
                        onClick={() => handleChangeMemberRole(memberRoleDialog.member, r)}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="apikeys">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <Button variant="outline" onClick={() => setApiKeyDialog(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((k: any) => (
                    <TableRow key={k.id}>
                      <TableCell>{k.name}</TableCell>
                      <TableCell>{k.created_at?.slice(0, 10)}</TableCell>
                      <TableCell>{k.last_used_at?.slice(0, 10) || '-'}</TableCell>
                      <TableCell>{k.revoked ? 'Revoked' : 'Active'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyApiKey(k)}
                          disabled={k.revoked}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedKeyId === k.id ? 'Copied!' : 'Copy'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {!k.revoked && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRevokeApiKeyDialog({ open: true, key: k })}
                          >
                            <Trash className="h-4 w-4" /> Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Create API Key Dialog */}
              <Dialog open={apiKeyDialog} onOpenChange={setApiKeyDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="API Key name"
                    value={newApiKeyName}
                    onChange={e => setNewApiKeyName(e.target.value)}
                  />
                  <DialogFooter>
                    <Button onClick={handleCreateApiKey} disabled={!newApiKeyName}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Revoke API Key Dialog */}
              <Dialog
                open={revokeApiKeyDialog.open}
                onOpenChange={open => setRevokeApiKeyDialog({ open, key: revokeApiKeyDialog.key })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Revoke API Key</DialogTitle>
                  </DialogHeader>
                  <div>
                    Are you sure you want to revoke <b>{revokeApiKeyDialog.key?.name}</b>?
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => handleRevokeApiKey(revokeApiKeyDialog.key)}
                    >
                      Revoke
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="depreciation">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Purchase Value</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Years</TableHead>
                    <TableHead>Salvage</TableHead>
                    <TableHead>Book Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.assets.map((a: any) => (
                    <TableRow key={a.asset_id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.purchase_value}</TableCell>
                      <TableCell>{a.purchase_date}</TableCell>
                      <TableCell>{a.depreciation_method || 'straight_line'}</TableCell>
                      <TableCell>{a.depreciation_period_years}</TableCell>
                      <TableCell>{a.salvage_value}</TableCell>
                      <TableCell>{getBookValue(a)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openDepreciationEdit(a)}
                        >
                          <BarChart3 className="h-4 w-4" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-2"
                          onClick={() => setChartDialog({ open: true, asset: a })}
                        >
                          View Chart
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Edit Depreciation Dialog */}
              <Dialog
                open={depreciationEditDialog.open}
                onOpenChange={open =>
                  setDepreciationEditDialog({ open, asset: depreciationEditDialog.asset })
                }
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Depreciation</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Purchase Value"
                    type="number"
                    value={depValue}
                    onChange={e => setDepValue(e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Purchase Date"
                    type="date"
                    value={depDate}
                    onChange={e => setDepDate(e.target.value)}
                    className="mb-2"
                  />
                  <select
                    value={depMethod}
                    onChange={e => setDepMethod(e.target.value)}
                    className="w-full mb-2 border rounded p-2"
                  >
                    <option value="straight_line">Straight Line</option>
                  </select>
                  <Input
                    placeholder="Years"
                    type="number"
                    value={depYears}
                    onChange={e => setDepYears(e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Salvage Value"
                    type="number"
                    value={depSalvage}
                    onChange={e => setDepSalvage(e.target.value)}
                    className="mb-2"
                  />
                  <DialogFooter>
                    <Button onClick={handleSaveDepreciation}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Value Over Time Chart Dialog */}
              <Dialog
                open={chartDialog.open}
                onOpenChange={open => setChartDialog({ open, asset: chartDialog.asset })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Value Over Time: {chartDialog.asset?.name}</DialogTitle>
                  </DialogHeader>
                  {chartDialog.asset && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getValueOverTime(chartDialog.asset)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="customreports">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReportDialog(true)
                    setEditReportIdx(null)
                    setReportName('')
                    setReportSource('assets')
                    setReportFields([])
                    setReportFilter('')
                    setReportAgg('')
                    setReportChart('table')
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Filter</TableHead>
                    <TableHead>Aggregation</TableHead>
                    <TableHead>Chart</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customReports.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{sources[r.source]?.label}</TableCell>
                      <TableCell>{r.fields?.join(', ')}</TableCell>
                      <TableCell>{r.filter}</TableCell>
                      <TableCell>{r.agg}</TableCell>
                      <TableCell>{r.chart}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="secondary" onClick={() => setRunReport(r)}>
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-2"
                          onClick={() => {
                            setEditReportIdx(idx)
                            setReportDialog(true)
                            setReportName(r.name)
                            setReportSource(r.source)
                            setReportFields(r.fields)
                            setReportFilter(r.filter)
                            setReportAgg(r.agg)
                            setReportChart(r.chart)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="ml-2"
                          onClick={() => deleteReport(idx)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Report Builder Dialog */}
              <Dialog open={reportDialog} onOpenChange={setReportDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editReportIdx !== null ? 'Edit' : 'New'} Custom Report
                    </DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Report name"
                    value={reportName}
                    onChange={e => setReportName(e.target.value)}
                    className="mb-2"
                  />
                  <div className="mb-2">
                    <label>Source: </label>
                    <select
                      value={reportSource}
                      onChange={e => {
                        setReportSource(e.target.value as keyof typeof sources)
                        setReportFields([])
                      }}
                      className="border rounded p-2 ml-2"
                    >
                      {Object.entries(sources).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label>Fields: </label>
                    {sources[reportSource].fields.map((f: string) => (
                      <label key={f} className="ml-2">
                        <input
                          type="checkbox"
                          checked={reportFields.includes(f)}
                          onChange={e =>
                            setReportFields(
                              e.target.checked
                                ? [...reportFields, f]
                                : reportFields.filter(x => x !== f)
                            )
                          }
                        />{' '}
                        {f}
                      </label>
                    ))}
                  </div>
                  <div className="mb-2">
                    <label>Advanced Filters: </label>
                    {reportFilters.map((f, i) => (
                      <div key={i} className="flex gap-2 mb-1">
                        <select
                          value={f.field}
                          onChange={e =>
                            setReportFilters(
                              reportFilters.map((x, j) =>
                                j === i ? { ...x, field: e.target.value } : x
                              )
                            )
                          }
                        >
                          {sources[reportSource].fields.map((fld: string) => (
                            <option key={fld} value={fld}>
                              {fld}
                            </option>
                          ))}
                        </select>
                        <select
                          value={f.op}
                          onChange={e =>
                            setReportFilters(
                              reportFilters.map((x, j) =>
                                j === i ? { ...x, op: e.target.value } : x
                              )
                            )
                          }
                        >
                          <option value="=">=</option>
                          <option value="contains">contains</option>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                          <option value=">=">&ge;</option>
                          <option value="<=">&le;</option>
                          <option value="between">between</option>
                        </select>
                        {(() => {
                          const isDate = ['created_at', 'purchase_date'].includes(f.field)
                          if (isDate && f.op === 'between') {
                            const [start, end] = f.value.split(',')
                            const range: DateRange = {
                              from: start ? new Date(start) : undefined,
                              to: end ? new Date(end) : undefined,
                            }
                            return (
                              <Calendar
                                mode="range"
                                selected={range}
                                onSelect={(range: DateRange | undefined) => {
                                  setReportFilters(
                                    reportFilters.map((x, j) =>
                                      j === i
                                        ? {
                                            ...x,
                                            value:
                                              (range?.from
                                                ? range.from.toISOString().slice(0, 10)
                                                : '') +
                                              ',' +
                                              (range?.to
                                                ? range.to.toISOString().slice(0, 10)
                                                : ''),
                                          }
                                        : x
                                    )
                                  )
                                }}
                              />
                            )
                          } else if (isDate) {
                            return (
                              <Calendar
                                mode="single"
                                selected={f.value ? new Date(f.value) : undefined}
                                onSelect={(d: Date | undefined) =>
                                  setReportFilters(
                                    reportFilters.map((x, j) =>
                                      j === i
                                        ? { ...x, value: d ? d.toISOString().slice(0, 10) : '' }
                                        : x
                                    )
                                  )
                                }
                              />
                            )
                          } else {
                            return (
                              <Input
                                value={f.value}
                                onChange={e =>
                                  setReportFilters(
                                    reportFilters.map((x, j) =>
                                      j === i ? { ...x, value: e.target.value } : x
                                    )
                                  )
                                }
                                placeholder="Value"
                              />
                            )
                          }
                        })()}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setReportFilters(reportFilters.filter((_, j) => j !== i))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setReportFilters([
                          ...reportFilters,
                          { field: sources[reportSource].fields[0], op: '=', value: '' },
                        ])
                      }
                    >
                      Add Filter
                    </Button>
                  </div>
                  <div className="mb-2">
                    <label>Group By: </label>
                    <select
                      value={reportGroupBy}
                      onChange={e => setReportGroupBy(e.target.value)}
                      className="border rounded p-2 ml-2"
                    >
                      <option value="">None</option>
                      {sources[reportSource].fields.map((fld: string) => (
                        <option key={fld} value={fld}>
                          {fld}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label>Aggregation: </label>
                    <select
                      value={reportAggType}
                      onChange={e => setReportAggType(e.target.value)}
                      className="border rounded p-2 ml-2"
                    >
                      <option value="">None</option>
                      <option value="count">Count</option>
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="min">Min</option>
                      <option value="max">Max</option>
                    </select>
                    {reportAggType && reportAggType !== 'count' && (
                      <select
                        value={reportAggField}
                        onChange={e => setReportAggField(e.target.value)}
                        className="border rounded p-2 ml-2"
                      >
                        {sources[reportSource].fields.map((fld: string) => (
                          <option key={fld} value={fld}>
                            {fld}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        const report = {
                          name: reportName,
                          source: reportSource,
                          fields: reportFields,
                          filter: reportFilter,
                          filters: reportFilters,
                          agg: reportAgg,
                          aggType: reportAggType,
                          aggField: reportAggField,
                          groupBy: reportGroupBy,
                          chart: reportChart,
                        }
                        saveReport(report, editReportIdx)
                        setReportDialog(false)
                      }}
                      disabled={!reportName || !reportFields.length || reportsLoading}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                  <div className="mt-4">
                    <div className="font-bold mb-2">Live Preview:</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {reportFields.map((f: string) => (
                            <TableHead key={f}>{f}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getReportData({
                          name: reportName,
                          source: reportSource,
                          fields: reportFields,
                          filter: reportFilter,
                          filters: reportFilters,
                          agg: reportAgg,
                          aggType: reportAggType,
                          aggField: reportAggField,
                          groupBy: reportGroupBy,
                          chart: reportChart,
                        })
                          .slice(0, 5)
                          .map((row: any, i: number) => (
                            <TableRow key={i}>
                              {reportFields.map((f: string) => (
                                <TableCell key={f}>{row[f]}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Run Report Dialog */}
              <Dialog
                open={!!runReport}
                onOpenChange={open => {
                  if (!open) setRunReport(null)
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report: {runReport?.name}</DialogTitle>
                  </DialogHeader>
                  {runReport && (
                    <>
                      <div className="mb-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportReport(getReportData(runReport))}
                        >
                          Export CSV
                        </Button>
                      </div>
                      {runReport.chart === 'table' && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {runReport.fields.map((f: string) => (
                                <TableHead key={f}>{f}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getReportData(runReport).map((row: any, i: number) => (
                              <TableRow key={i}>
                                {runReport.fields.map((f: string) => (
                                  <TableCell key={f}>{row[f]}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                      {runReport.chart === 'bar' && (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getReportData(runReport)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={runReport.fields[0]} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey={runReport.fields[1]} fill="#2563eb" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {runReport.chart === 'pie' && (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={getReportData(runReport)}
                              dataKey={runReport.fields[1]}
                              nameKey={runReport.fields[0]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#2563eb"
                              label
                            />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </>
                  )}
                </DialogContent>
              </Dialog>
              {reportsLoading && <div className="p-4 text-center">Loading reports...</div>}
              {reportsError && <div className="p-4 text-center text-red-500">{reportsError}</div>}
            </TabsContent>
            <TabsContent value="roles">
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <Button
                  onClick={() => {
                    setRoleDialog({ open: true, role: null })
                    setRoleName('')
                    setRolePerms([])
                  }}
                >
                  Create Role
                </Button>
                {rolesLoading && <span className="ml-4">Loading roles...</span>}
                {rolesError && <span className="ml-4 text-red-500">{rolesError}</span>}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(role => (
                    <TableRow key={role.id}>
                      <TableCell>{role.name}</TableCell>
                      <TableCell>{role.permissions.join(', ')}</TableCell>
                      <TableCell>{role.is_builtin ? 'Built-in' : 'Custom'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mr-2"
                          onClick={() => {
                            setViewPermsRole(role.name)
                            setEditPerms(role.permissions)
                          }}
                        >
                          View
                        </Button>
                        {!role.is_builtin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mr-2"
                              onClick={() => {
                                setRoleDialog({ open: true, role })
                                setRoleName(role.name)
                                setRolePerms(role.permissions)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteRoleDialog({ open: true, role })}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Create/Edit Role Dialog */}
              <Dialog
                open={roleDialog.open}
                onOpenChange={open => setRoleDialog({ open, role: roleDialog.role })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{roleDialog.role ? 'Edit Role' : 'Create Role'}</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Role name"
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                    className="mb-2"
                  />
                  <div className="mb-2">Permissions:</div>
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={rolePerms.includes(p)}
                        onChange={e =>
                          setRolePerms(
                            e.target.checked ? [...rolePerms, p] : rolePerms.filter(x => x !== p)
                          )
                        }
                      />
                      {p}
                    </label>
                  ))}
                  <DialogFooter>
                    <Button onClick={saveRole} disabled={roleSaveLoading || !roleName}>
                      {roleSaveLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Delete Role Dialog */}
              <Dialog
                open={deleteRoleDialog.open}
                onOpenChange={open => setDeleteRoleDialog({ open, role: deleteRoleDialog.role })}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Role</DialogTitle>
                  </DialogHeader>
                  <div>
                    Are you sure you want to delete the role &quot;{deleteRoleDialog.role?.name}
                    &quot;?
                  </div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={deleteRole}>
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteRoleDialog({ open: false, role: null })}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
