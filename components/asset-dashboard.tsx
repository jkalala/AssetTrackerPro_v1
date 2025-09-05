'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import AssetGeofenceEvents from './asset-geofence-events'

export default function AssetDashboard() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    retired: 0,
  })

  const { toast } = useToast()
  // Predictive Maintenance State
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [prediction, setPrediction] = useState<null | {
    will_fail_soon: boolean
    probability: number
  }>(null)
  const [predicting, setPredicting] = useState(false)
  const [anomalyResults, setAnomalyResults] = useState<null | number[]>(null)
  const [anomalyLoading, setAnomalyLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; asset: any | null }>({
    open: false,
    asset: null,
  })

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setError(null)
        console.log('AssetDashboard: Fetching assets')

        // Create client with explicit error handling
        let supabase
        try {
          supabase = createClient()
          console.log('AssetDashboard: Supabase client created successfully')
        } catch (err) {
          console.error('AssetDashboard: Error creating Supabase client:', err)
          setError('Failed to initialize database connection')
          setLoading(false)
          return
        }

        // Fetch assets with error handling
        try {
          const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)

          if (error) throw error

          setAssets(data || [])

          // Calculate stats
          if (data) {
            const activeAssets = data.filter((asset: any) => asset.status === 'active').length
            const maintenanceAssets = data.filter(
              (asset: any) => asset.status === 'maintenance'
            ).length
            const retiredAssets = data.filter((asset: any) => asset.status === 'retired').length

            setStats({
              total: data.length,
              active: activeAssets,
              maintenance: maintenanceAssets,
              retired: retiredAssets,
            })
          }
        } catch (error) {
          console.error('Error fetching assets:', error)
          setError('Failed to load assets')
        }
      } catch (error) {
        console.error('Error in fetchAssets:', error)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  // Helper to get asset features by id
  const getAssetFeatures = (id: string) => {
    const asset = assets.find(a => a.id === id)
    if (!asset) return null
    return {
      usage_hours: asset.usage_hours || 0,
      last_maintenance_days: asset.last_maintenance_days || 0,
      failures: asset.failures || 0,
      age_years: asset.age_years || 0,
    }
  }

  const handlePredict = async () => {
    if (!selectedAssetId) return
    const features = getAssetFeatures(selectedAssetId)
    if (!features) {
      toast({
        title: 'Asset data missing',
        description: 'Cannot find features for selected asset.',
        variant: 'destructive',
      })
      return
    }
    setPredicting(true)
    setPrediction(null)
    try {
      const res = await fetch('/api/ml/predict-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      })
      const data = await res.json()
      setPrediction(data)
    } catch (err) {
      toast({ title: 'Prediction failed', description: String(err), variant: 'destructive' })
    } finally {
      setPredicting(false)
    }
  }

  const handleAnomalyDetection = async () => {
    setAnomalyLoading(true)
    setAnomalyResults(null)
    try {
      const featuresList = assets.map(asset => [
        asset.usage_hours || 0,
        asset.last_maintenance_days || 0,
        asset.failures || 0,
        asset.age_years || 0,
      ])
      const res = await fetch('/api/ml/anomaly-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features_list: featuresList }),
      })
      const data = await res.json()
      setAnomalyResults(data.anomalies)
    } catch (err) {
      toast({ title: 'Anomaly detection failed', description: String(err), variant: 'destructive' })
    } finally {
      setAnomalyLoading(false)
    }
  }

  const handleDelete = async (asset: any) => {
    setDeleteDialog({ open: false, asset: null })
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Delete Failed',
          description: data.error || 'Failed to delete asset',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Asset Deleted', description: `${asset.name} has been deleted.` })
        setAssets(prev => prev.filter(a => a.id !== asset.id))
      }
    } catch (e) {
      toast({
        title: 'Delete Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        )
      case 'maintenance':
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Maintenance
          </Badge>
        )
      case 'retired':
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Retired
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {status}
          </Badge>
        )
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.maintenance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retired</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.retired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Maintenance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Predictive Maintenance (AI)</CardTitle>
          <CardDescription>
            Select an asset to predict if it will require maintenance soon, powered by AI/ML.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Asset</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedAssetId}
                onChange={e => {
                  setSelectedAssetId(e.target.value)
                  setPrediction(null)
                }}
              >
                <option value="">Select asset...</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} (ID: {asset.id})
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handlePredict}
              disabled={!selectedAssetId || predicting}
              className="mt-4 md:mt-0"
            >
              {predicting ? 'Predicting...' : 'Predict Maintenance'}
            </Button>
          </div>
          {prediction && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                {prediction.will_fail_soon ? (
                  <AlertCircle className="text-red-600" />
                ) : (
                  <CheckCircle className="text-green-600" />
                )}
                <span className="font-semibold">
                  {prediction.will_fail_soon
                    ? 'Maintenance Needed Soon'
                    : 'No Immediate Maintenance Needed'}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  (Confidence: {(prediction.probability * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anomaly Detection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Anomaly Detection (AI)</CardTitle>
          <CardDescription>
            Run anomaly detection on your recent assets to flag unusual patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnomalyDetection} disabled={anomalyLoading || assets.length === 0}>
            {anomalyLoading ? 'Detecting...' : 'Run Anomaly Detection'}
          </Button>
          {anomalyResults && (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset, idx) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <Link
                          href={`/asset/${asset.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {asset.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {anomalyResults[idx] === -1 ? (
                          <span className="flex items-center text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-1" /> Anomaly
                          </span>
                        ) : (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" /> Normal
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Assets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Assets</CardTitle>
            <CardDescription>Your most recently added assets</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/assets">
                <Search className="h-4 w-4 mr-2" />
                View All
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/add-asset">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No assets found</h3>
              <p className="text-gray-500 mt-1">Get started by adding your first asset.</p>
              <Button className="mt-4" asChild>
                <Link href="/add-asset">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map(asset => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/asset/${asset.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {asset.name}
                        </Link>
                        <Button asChild size="sm" variant="outline" className="ml-2">
                          <Link href={`/asset/${asset.id}/edit`}>
                            <Edit className="h-3 w-3" />
                          </Link>
                        </Button>
                        {/* Geofence Events */}
                        <div className="mt-2">
                          <AssetGeofenceEvents assetId={asset.id} />
                        </div>
                      </TableCell>
                      <TableCell>{asset.category || 'Uncategorized'}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>{asset.location || 'Unknown'}</TableCell>
                      <TableCell className="text-right">
                        {asset.value ? `$${Number.parseFloat(asset.value).toFixed(2)}` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={deleteDialog.open}
        onOpenChange={open => setDeleteDialog({ open, asset: deleteDialog.asset })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete <b>{deleteDialog.asset?.name}</b>?
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.asset && handleDelete(deleteDialog.asset)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
