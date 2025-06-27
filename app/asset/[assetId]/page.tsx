"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  Loader2, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  QrCode,
  MapPin,
  Calendar,
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

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const assetId = params.assetId as string

  useEffect(() => {
    if (!authLoading && user && assetId) {
      fetchAsset()
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
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
