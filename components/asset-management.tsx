"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Eye, 
  QrCode,
  Loader2,
  CheckCircle,
  Settings,
  Trash2,
  Pencil
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Asset } from "@/lib/asset-actions"
import Link from "next/link"
import { ToastAction } from "@/components/ui/toast";

interface AssetManagementProps {
  assets: Asset[]
  loading?: boolean
  onRefresh?: () => void
}

export default function AssetManagement({ assets, loading = false, onRefresh }: AssetManagementProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({ status: 'all', category: 'all' })
  const [showFilters, setShowFilters] = useState(false)
  const [bulkOperation, setBulkOperation] = useState({
    type: 'update_status' as const,
    value: '',
    open: false
  })
  const [processing, setProcessing] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; asset: Asset | null }>({ open: false, asset: null });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false);
  const [bulkField, setBulkField] = useState<'status' | 'category' | 'location'>('status');
  const [bulkValue, setBulkValue] = useState('');
  const [undoData, setUndoData] = useState<{ asset_ids: string[], prevValues: any[] } | null>(null);
  const [undoBulkUpdate, setUndoBulkUpdate] = useState<{ asset_ids: string[], prevValues: any[], field: string } | null>(null);
  const [undoBulkDelete, setUndoBulkDelete] = useState<{ assets: any[] } | null>(null);
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<{ [assetId: string]: { [fieldId: string]: string } }>({})
  const [categories, setCategories] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCustomFields() {
      const res = await fetch("/api/custom-fields")
      const json = await res.json()
      setCustomFieldDefs(json.data || [])
    }
    fetchCustomFields()
  }, [])

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/categories")
      const json = await res.json()
      setCategories(json.data || [])
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    async function fetchAllCustomFieldValues() {
      if (!assets || assets.length === 0) return
      const all: { [assetId: string]: { [fieldId: string]: string } } = {}
      await Promise.all(assets.map(async (asset) => {
        const res = await fetch(`/api/assets/${asset.id}/custom-fields`)
        const json = await res.json()
        all[asset.id!] = {}
        if (json.data) {
          for (const cf of json.data) {
            all[asset.id!][cf.field_id] = cf.value
          }
        }
      }))
      setCustomFieldValues(all)
    }
    fetchAllCustomFieldValues()
  }, [assets])

  // Helper to build category options (flat with indentation for subcategories)
  const buildCategoryOptions = (list: any[], parentId: string | null = null, level = 0): any[] =>
    list.filter(c => (c.parent_id || "") === (parentId || "")).flatMap(c => [
      { ...c, indent: level },
      ...buildCategoryOptions(list, c.id, level + 1)
    ])

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filters.status === 'all' || asset.status === filters.status
    const matchesCategory = filters.category === 'all' || asset.category === filters.category

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(filteredAssets.map(asset => asset.id!))
    } else {
      setSelectedAssets([])
    }
  }

  const handleSelectAsset = (assetId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, assetId])
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== assetId))
    }
  }

  const handleBulkOperation = async () => {
    if (selectedAssets.length === 0) {
      toast({
        title: "No Assets Selected",
        description: "Please select at least one asset to perform bulk operations.",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/assets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_ids: selectedAssets,
          operation: bulkOperation.type,
          value: bulkOperation.value
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Bulk Update Successful",
          description: `${result.updatedCount} assets updated successfully.`
        })
        setSelectedAssets([])
        onRefresh?.()
      } else {
        toast({
          title: "Bulk Update Failed",
          description: result.error || "Failed to update assets",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
      setBulkOperation(prev => ({ ...prev, open: false, value: '' }))
    }
  }

  const handleDelete = async (asset: Asset) => {
    setDeleteDialog({ open: false, asset: null });
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Delete Failed", description: data.error || "Failed to delete asset", variant: "destructive" });
      } else {
        toast({ title: "Asset Deleted", description: `${asset.name} has been deleted.` });
        onRefresh?.();
      }
    } catch (e) {
      toast({ title: "Delete Failed", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteDialog(false);
    // Fetch asset data for undo
    let prevAssets: any[] = [];
    try {
      const resPrev = await fetch('/api/assets/bulk-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ids: selectedAssets })
      });
      prevAssets = await resPrev.json();
    } catch {}
    try {
      const res = await fetch('/api/assets/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ids: selectedAssets })
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Bulk Delete Failed', description: data.error || 'Failed to delete assets', variant: 'destructive' });
      } else {
        setUndoBulkDelete({ assets: prevAssets });
        toast({
          title: 'Assets Deleted',
          description: `${selectedAssets.length} assets deleted.`,
          action: (
            <ToastAction altText="Undo" onClick={handleUndoBulkDelete}>
              Undo
            </ToastAction>
          ),
        });
        setSelectedAssets([]);
        onRefresh?.();
      }
    } catch (e) {
      toast({ title: 'Bulk Delete Failed', description: 'An unexpected error occurred', variant: 'destructive' });
    }
  };

  const handleBulkUpdate = async () => {
    setBulkUpdateDialog(false);
    // Fetch previous values for undo
    let prevValues: any[] = [];
    try {
      const resPrev = await fetch('/api/assets/bulk-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ids: selectedAssets, field: bulkField })
      });
      prevValues = await resPrev.json();
    } catch {}
    try {
      const res = await fetch('/api/assets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_ids: selectedAssets,
          operation: `update_${bulkField}`,
          value: bulkValue
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Bulk Update Failed', description: data.error || 'Failed to update assets', variant: 'destructive' });
      } else {
        setUndoBulkUpdate({ asset_ids: selectedAssets, prevValues, field: bulkField });
        toast({
          title: 'Assets Updated',
          description: `${selectedAssets.length} assets updated.`,
          action: (
            <ToastAction altText="Undo" onClick={handleUndoBulkUpdate}>
              Undo
            </ToastAction>
          ),
        });
        setSelectedAssets([]);
        onRefresh?.();
      }
    } catch (e) {
      toast({ title: 'Bulk Update Failed', description: 'An unexpected error occurred', variant: 'destructive' });
    }
  };

  const handleUndoBulkUpdate = async () => {
    if (!undoBulkUpdate) return;
    try {
      await fetch('/api/assets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_ids: undoBulkUpdate.asset_ids,
          operation: `update_${undoBulkUpdate.field}`,
          value: null, // Will be set per asset below
          prevValues: undoBulkUpdate.prevValues
        })
      });
      toast({ title: 'Undo Successful', description: 'Bulk update has been undone.' });
      onRefresh?.();
    } catch {
      toast({ title: 'Undo Failed', description: 'Could not undo bulk update.', variant: 'destructive' });
    } finally {
      setUndoBulkUpdate(null);
    }
  };

  const handleUndoBulkDelete = async () => {
    if (!undoBulkDelete) return;
    try {
      await fetch('/api/assets/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: undoBulkDelete.assets })
      });
      toast({ title: 'Undo Successful', description: 'Bulk delete has been undone.' });
      onRefresh?.();
    } catch {
      toast({ title: 'Undo Failed', description: 'Could not undo bulk delete.', variant: 'destructive' });
    } finally {
      setUndoBulkDelete(null);
    }
  };

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Management</h2>
          <p className="text-gray-600">Manage your asset inventory with advanced features</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/add-asset">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search & Filters
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search assets by name, description, category, location, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {buildCategoryOptions(categories).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {"\u00A0".repeat(cat.indent * 4)}{cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ status: 'all', category: 'all' })}
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      {selectedAssets.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              Bulk Operations ({selectedAssets.length} assets selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Select
                value={bulkOperation.type}
                onValueChange={(value: any) => setBulkOperation(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update_status">Update Status</SelectItem>
                  <SelectItem value="update_location">Update Location</SelectItem>
                  <SelectItem value="update_category">Update Category</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder={
                  bulkOperation.type === 'update_status' ? 'Enter new status' :
                  bulkOperation.type === 'update_location' ? 'Enter new location' :
                  'Enter new category'
                }
                value={bulkOperation.value}
                onChange={(e) => setBulkOperation(prev => ({ ...prev, value: e.target.value }))}
                className="w-64"
              />

              <Dialog open={bulkOperation.open} onOpenChange={(open) => setBulkOperation(prev => ({ ...prev, open }))}>
                <DialogTrigger asChild>
                  <Button
                    disabled={processing || !bulkOperation.value}
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Update Selected
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Update</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to update {selectedAssets.length} selected assets?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setBulkOperation(prev => ({ ...prev, open: false }))}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkOperation}
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => setSelectedAssets([])}
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAssets.length > 0 && (
        <div className="flex items-center mb-2 space-x-2">
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete Selected ({selectedAssets.length})
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setBulkUpdateDialog(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Bulk Update
          </Button>
        </div>
      )}

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Assets ({filteredAssets.length})
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-500">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading assets...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.keys(filters).length > 0 
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first asset"
                }
              </p>
              {!searchTerm && Object.keys(filters).length === 0 && (
                <Button asChild>
                  <Link href="/add-asset">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Asset
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Value</TableHead>
                    {/* Custom Field Columns */}
                    {customFieldDefs.slice(0, 2).map(field => (
                      <TableHead key={field.id}>{field.label}</TableHead>
                    ))}
                    <TableHead>Created</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAssets.includes(asset.id!)}
                          onCheckedChange={(checked) => handleSelectAsset(asset.id!, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {asset.asset_id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          {asset.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {asset.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{categories.find(c => c.id === asset.category)?.name || asset.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{formatCurrency(asset.purchase_value)}</TableCell>
                      {/* Custom Field Values */}
                      {customFieldDefs.slice(0, 2).map(field => (
                        <TableCell key={field.id}>
                          {customFieldValues[asset.id!] && customFieldValues[asset.id!][field.id]
                            ? customFieldValues[asset.id!][field.id]
                            : <span className="text-gray-400">-</span>}
                        </TableCell>
                      ))}
                      <TableCell>{formatDate(asset.created_at)}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/asset/${asset.id}`}>View</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="ml-2">
                          <Link href={`/asset/${asset.id}/edit`}>Edit</Link>
                        </Button>
                        <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(asset)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({ open, asset: deleteDialog.asset })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete <b>{deleteDialog.asset?.name}</b>?</div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => deleteDialog.asset && handleDelete(deleteDialog.asset)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Assets</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete <b>{selectedAssets.length}</b> selected assets? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleBulkDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkUpdateDialog} onOpenChange={setBulkUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Assets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Field to Update</label>
              <select className="w-full border rounded p-2" value={bulkField} onChange={e => setBulkField(e.target.value as any)}>
                <option value="status">Status</option>
                <option value="category">Category</option>
                <option value="location">Location</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Value</label>
              <input className="w-full border rounded p-2" value={bulkValue} onChange={e => setBulkValue(e.target.value)} placeholder={`Enter new ${bulkField}`} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBulkUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 