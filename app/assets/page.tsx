'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import AssetManagement from '@/components/asset-management'
import { Asset, getAssets } from '@/lib/asset-actions'
import BulkAssetImport from '@/components/BulkAssetImport'

export default function AssetsPage() {
  const { user, loading: authLoading } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchAssets = async () => {
    try {
      setError(null)
      const result = await getAssets()

      if (result.error) {
        setError(result.error)
        toast({
          title: 'Error Loading Assets',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        setAssets(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      setError('Failed to load assets')
      toast({
        title: 'Error Loading Assets',
        description: 'An unexpected error occurred while loading assets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAssets()
    setRefreshing(false)
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchAssets()
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Assets</h2>
              <p className="text-gray-600">Please wait while we fetch your asset inventory...</p>
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
              <CardDescription>Please log in to view and manage your assets.</CardDescription>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
                <p className="text-sm text-gray-600">Comprehensive asset inventory management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button asChild>
                <Link href="/add-asset">
                  <Package className="h-4 w-4 mr-2" />
                  Add Asset
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Bulk Import UI */}
        <BulkAssetImport />

        {/* Asset Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{assets.length}</div>
                <div className="text-sm text-gray-600">Total Assets</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {assets.filter(a => a.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Assets</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {assets.filter(a => a.status === 'maintenance').length}
                </div>
                <div className="text-sm text-gray-600">In Maintenance</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(assets.reduce((sum, asset) => sum + (asset.purchase_value || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Management Component */}
        <AssetManagement assets={assets} loading={loading} onRefresh={handleRefresh} />
      </div>
    </div>
  )
}
