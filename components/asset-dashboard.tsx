"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, AlertCircle, CheckCircle, Clock, Search, Plus } from "lucide-react"
import Link from "next/link"

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

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setError(null)
        console.log("AssetDashboard: Fetching assets")

        // Create client with explicit error handling
        let supabase
        try {
          supabase = createClient()
          console.log("AssetDashboard: Supabase client created successfully")
        } catch (err) {
          console.error("AssetDashboard: Error creating Supabase client:", err)
          setError("Failed to initialize database connection")
          setLoading(false)
          return
        }

        // Fetch assets with error handling
        try {
          const { data, error } = await supabase
            .from("assets")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5)

          if (error) throw error

          setAssets(data || [])

          // Calculate stats
          if (data) {
            const activeAssets = data.filter((asset) => asset.status === "active").length
            const maintenanceAssets = data.filter((asset) => asset.status === "maintenance").length
            const retiredAssets = data.filter((asset) => asset.status === "retired").length

            setStats({
              total: data.length,
              active: activeAssets,
              maintenance: maintenanceAssets,
              retired: retiredAssets,
            })
          }
        } catch (error) {
          console.error("Error fetching assets:", error)
          setError("Failed to load assets")
        }
      } catch (error) {
        console.error("Error in fetchAssets:", error)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Maintenance
          </Badge>
        )
      case "retired":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
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
            <div className="text-2xl font-bold">{loading ? "..." : stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.maintenance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retired</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.retired}</div>
          </CardContent>
        </Card>
      </div>

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
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        <Link href={`/asset/${asset.id}`} className="hover:text-blue-600 hover:underline">
                          {asset.name}
                        </Link>
                      </TableCell>
                      <TableCell>{asset.category || "Uncategorized"}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>{asset.location || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        {asset.value ? `$${Number.parseFloat(asset.value).toFixed(2)}` : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
