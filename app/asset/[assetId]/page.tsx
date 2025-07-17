"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"
import { 
  Package, 
  Loader2, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  QrCode,
  MapPin,
  DollarSign,
  User,
  Settings,
  FileText,
  Tag,
  Building,
  Hash
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Asset, getAsset, deleteAsset } from "@/lib/asset-actions"
import Link from "next/link"
import MaintenanceCalendar from "@/components/maintenance-calendar"

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const [customFields, setCustomFields] = useState<any[]>([])
  const [maintenance, setMaintenance] = useState<any[]>([])
  const [maintenanceLoading, setMaintenanceLoading] = useState(true)
  const [showMaintDialog, setShowMaintDialog] = useState(false)
  const [editingMaint, setEditingMaint] = useState<any | null>(null)
  const [maintForm, setMaintForm] = useState<any>({ type: "inspection", interval: "monthly", next_due: "", notes: "" })
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [historyForm, setHistoryForm] = useState<any>({ schedule_id: "", performed_at: "", notes: "" })

  const assetId = params.assetId as string

  useEffect(() => {
    if (!authLoading && user && assetId) {
      fetchAsset()
      fetchCustomFields()
      fetchMaintenance()
      fetchMaintenanceHistory()
    }
  }, [user, authLoading, assetId])

  const fetchAsset = async () => {
    try {
      setError(null)
      const result = await getAsset(assetId)
      
      if (result.error) {
        setError(result.error)
        toast({
          title: "Error Loading Asset",
          description: result.error,
          variant: "destructive"
        })
      } else {
        setAsset(result.data)
      }
    } catch (error) {
      console.error("Error fetching asset:", error)
      setError("Failed to load asset")
      toast({
        title: "Error Loading Asset",
        description: "An unexpected error occurred while loading the asset",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomFields = async () => {
    try {
      const res = await fetch(`/api/assets/${assetId}/custom-fields`)
      const json = await res.json()
      setCustomFields(json.data || [])
    } catch (err) {
      // ignore
    }
  }

  const fetchMaintenance = async () => {
    setMaintenanceLoading(true)
    const res = await fetch(`/api/assets/${assetId}/maintenance`)
    const json = await res.json()
    setMaintenance(json.data || [])
    setMaintenanceLoading(false)
  }

  const fetchMaintenanceHistory = async () => {
    setHistoryLoading(true)
    const res = await fetch(`/api/assets/${assetId}/maintenance/history`)
    const json = await res.json()
    setMaintenanceHistory(json.data || [])
    setHistoryLoading(false)
  }

  const openAddMaint = () => {
    setEditingMaint(null)
    setMaintForm({ type: "inspection", interval: "monthly", next_due: "", notes: "" })
    setShowMaintDialog(true)
  }

  const openEditMaint = (m: any) => {
    setEditingMaint(m)
    setMaintForm({ type: m.type, interval: m.interval, next_due: m.next_due, notes: m.notes })
    setShowMaintDialog(true)
  }

  const handleSaveMaint = async () => {
    let res
    if (editingMaint) {
      res = await fetch(`/api/assets/${assetId}/maintenance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingMaint.id, ...maintForm })
      })
    } else {
      res = await fetch(`/api/assets/${assetId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maintForm)
      })
    }
    const json = await res.json()
    if (json.error) {
      toast({ title: "Error", description: json.error, variant: "destructive" })
    } else {
      setShowMaintDialog(false)
      fetchMaintenance()
      toast({ title: "Saved", description: "Maintenance schedule saved." })
    }
  }

  const handleDeleteMaint = async (m: any) => {
    if (!window.confirm("Delete this maintenance schedule?")) return
    const res = await fetch(`/api/assets/${assetId}/maintenance`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id })
    })
    const json = await res.json()
    if (json.error) {
      toast({ title: "Error", description: json.error, variant: "destructive" })
    } else {
      fetchMaintenance()
      toast({ title: "Deleted", description: "Maintenance schedule deleted." })
    }
  }

  const openAddHistory = () => {
    setHistoryForm({ schedule_id: maintenance[0]?.id || "", performed_at: "", notes: "" })
    setShowHistoryDialog(true)
  }

  const handleSaveHistory = async () => {
    const res = await fetch(`/api/assets/${assetId}/maintenance/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...historyForm, performed_by: user?.id })
    })
    const json = await res.json()
    if (json.error) {
      toast({ title: "Error", description: json.error, variant: "destructive" })
    } else {
      setShowHistoryDialog(false)
      fetchMaintenanceHistory()
      toast({ title: "Logged", description: "Maintenance event logged." })
    }
  }

  const handleDelete = async () => {
    if (!asset) return

    if (!confirm(`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const result = await deleteAsset(asset.id!)
      
      if (result.error) {
        toast({
          title: "Error Deleting Asset",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Asset Deleted",
          description: "The asset has been successfully deleted."
        })
        router.push("/assets")
      }
    } catch (error) {
      toast({
        title: "Error Deleting Asset",
        description: "An unexpected error occurred while deleting the asset",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-50 text-green-700 border-green-200", label: "Active" },
      maintenance: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Maintenance" },
      retired: { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Retired" },
      lost: { color: "bg-red-50 text-red-700 border-red-200", label: "Lost" },
      damaged: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Damaged" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-blue-50 text-blue-700 border-blue-200",
      label: status
    }

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (value?: number | null) => {
    if (!value) return "N/A"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Asset</h2>
              <p className="text-gray-600">Please wait while we fetch the asset details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Authentication Required
              </CardTitle>
              <CardDescription>Please log in to view asset details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">Log In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Asset Not Found
              </CardTitle>
              <CardDescription>
                {error || "The requested asset could not be found."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/assets">Back to Assets</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
                <p className="text-sm text-gray-600">Asset ID: {asset.asset_id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/assets">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assets
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/asset/${asset.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              {asset.qr_code && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/qr-test?asset=${asset.id}`}>
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </Link>
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Overview */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Asset Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Asset ID</label>
                        <p className="font-mono text-lg">{asset.asset_id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">{getStatusBadge(asset.status)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-lg">{asset.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="text-lg flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {asset.location || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* --- Custom Fields Section --- */}
                    {customFields.length > 0 && (
                      <div className="pt-6 border-t">
                        <h3 className="font-semibold mb-2">Custom Fields</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customFields.map(cf => (
                            <div key={cf.field_id} className="space-y-1">
                              <label className="text-sm font-medium text-gray-500">{cf.asset_field_definitions?.label || cf.field_id}</label>
                              <p className="text-lg">{cf.value || <span className="text-gray-400">Not specified</span>}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* --- End Custom Fields Section --- */}

                    {asset.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-lg mt-1">{asset.description}</p>
                      </div>
                    )}

                    {asset.tags && asset.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {asset.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {asset.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{asset.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Technical Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                        <p className="text-lg flex items-center">
                          <Building className="h-4 w-4 mr-1 text-gray-400" />
                          {asset.manufacturer || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Model</label>
                        <p className="text-lg">{asset.model || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Serial Number</label>
                        <p className="font-mono text-lg flex items-center">
                          <Hash className="h-4 w-4 mr-1 text-gray-400" />
                          {asset.serial_number || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assigned To</label>
                        <p className="text-lg flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {asset.assigned_to || "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Dates & Warranty
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                        <p className="text-lg">{formatDate(asset.purchase_date)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Warranty Expiry</label>
                        <p className="text-lg">{formatDate(asset.warranty_expiry)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="text-lg">{formatDate(asset.created_at || undefined)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="text-lg">{formatDate(asset.updated_at || undefined)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Asset History</CardTitle>
                    <CardDescription>Track changes and activities for this asset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Asset history tracking coming soon...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Maintenance Schedules</CardTitle>
                    <Button onClick={openAddMaint} size="sm">Add Schedule</Button>
                  </CardHeader>
                  <CardContent>
                    {maintenanceLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading...</div>
                    ) : maintenance.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No maintenance schedules defined yet.</div>
                    ) : (
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Interval</th>
                            <th className="p-2 text-left">Next Due</th>
                            <th className="p-2 text-left">Notes</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {maintenance.map(m => (
                            <tr key={m.id} className="border-t">
                              <td className="p-2 capitalize">{m.type}</td>
                              <td className="p-2">{m.interval}</td>
                              <td className="p-2">{m.next_due}</td>
                              <td className="p-2">{m.notes}</td>
                              <td className="p-2">{m.status}</td>
                              <td className="p-2">
                                <Button variant="outline" size="icon" className="mr-1" onClick={() => openEditMaint(m)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDeleteMaint(m)}><Trash2 className="h-4 w-4" /></Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Maintenance History</CardTitle>
                    <Button onClick={openAddHistory} size="sm">Log Event</Button>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading...</div>
                    ) : maintenanceHistory.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No maintenance events logged yet.</div>
                    ) : (
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-2 text-left">Schedule</th>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Notes</th>
                            <th className="p-2 text-left">Performed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {maintenanceHistory.map(h => (
                            <tr key={h.id} className="border-t">
                              <td className="p-2">{maintenance.find(m => m.id === h.schedule_id)?.type || "-"}</td>
                              <td className="p-2">{h.performed_at}</td>
                              <td className="p-2">{h.notes}</td>
                              <td className="p-2">{h.performed_by?.full_name || h.performed_by?.email || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>

                <MaintenanceCalendar assetId={assetId} schedules={maintenance} history={maintenanceHistory} />

                <Dialog open={showMaintDialog} onOpenChange={setShowMaintDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingMaint ? "Edit Maintenance Schedule" : "Add Maintenance Schedule"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <Select value={maintForm.type} onValueChange={val => setMaintForm((f: any) => ({ ...f, type: val }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="calibration">Calibration</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={maintForm.interval} onValueChange={val => setMaintForm((f: any) => ({ ...f, interval: val }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="one-time">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="date" value={maintForm.next_due} onChange={e => setMaintForm((f: any) => ({ ...f, next_due: e.target.value }))} />
                      <Input placeholder="Notes" value={maintForm.notes} onChange={e => setMaintForm((f: any) => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveMaint}>{editingMaint ? "Save Changes" : "Add Schedule"}</Button>
                      <Button variant="outline" onClick={() => setShowMaintDialog(false)}>Cancel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Maintenance Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <Select value={historyForm.schedule_id} onValueChange={val => setHistoryForm((f: any) => ({ ...f, schedule_id: val }))}>
                        <SelectTrigger><SelectValue placeholder="Select schedule" /></SelectTrigger>
                        <SelectContent>
                          {maintenance.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.type} ({m.interval})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="date" value={historyForm.performed_at} onChange={e => setHistoryForm((f: any) => ({ ...f, performed_at: e.target.value }))} />
                      <Input placeholder="Notes" value={historyForm.notes} onChange={e => setHistoryForm((f: any) => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveHistory}>Log Event</Button>
                      <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>Cancel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Purchase Value</label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(asset.purchase_value)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full" size="sm">
                  <Link href={`/asset/${asset.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Asset
                  </Link>
                </Button>
                {asset.qr_code && (
                  <Button asChild className="w-full" size="sm" variant="outline">
                    <Link href={`/qr-test?asset=${asset.id}`}>
                      <QrCode className="h-4 w-4 mr-2" />
                      View QR Code
                    </Link>
                  </Button>
                )}
                <Button
                  className="w-full"
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Asset
                </Button>
              </CardContent>
            </Card>

            {/* Asset Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span>{formatDate(asset.created_at || undefined)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated:</span>
                  <span>{formatDate(asset.updated_at || undefined)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Asset ID:</span>
                  <span className="font-mono">{asset.asset_id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
