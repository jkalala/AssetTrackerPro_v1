"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Scan, QrCode, MapPin, Activity } from "lucide-react"

interface QRAnalyticsProps {
  assets: Array<{
    id: string
    asset_id: string
    name: string
    category: string
    qr_code?: string | null
    location?: string | null
  }>
}

export default function QRAnalytics({ assets }: QRAnalyticsProps) {
  const [analytics, setAnalytics] = useState({
    totalQRCodes: 0,
    qrCoverage: 0,
    scansByCategory: {} as Record<string, number>,
    scansByLocation: {} as Record<string, number>,
    recentScans: [] as Array<{
      assetId: string
      assetName: string
      timestamp: string
      location?: string
    }>,
  })

  useEffect(() => {
    // Calculate analytics from assets data
    const totalAssets = assets.length
    const assetsWithQR = assets.filter((asset) => asset.qr_code).length
    const qrCoverage = totalAssets > 0 ? Math.round((assetsWithQR / totalAssets) * 100) : 0

    // Mock scan data by category
    const scansByCategory = {
      "it-equipment": 45,
      furniture: 23,
      "av-equipment": 18,
      vehicles: 12,
      tools: 8,
    }

    // Mock scan data by location
    const scansByLocation = {
      "Office A": 32,
      Warehouse: 28,
      "Office B": 21,
      "Conference Room": 15,
      Storage: 10,
    }

    // Mock recent scans
    const recentScans = [
      {
        assetId: "AST-001",
        assetName: 'MacBook Pro 16"',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        location: "Office A",
      },
      {
        assetId: "AST-002",
        assetName: "Office Chair",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        location: "Office B",
      },
      {
        assetId: "AST-003",
        assetName: "Projector",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        location: "Conference Room",
      },
    ]

    setAnalytics({
      totalQRCodes: assetsWithQR,
      qrCoverage,
      scansByCategory,
      scansByLocation,
      recentScans,
    })
  }, [assets])

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const scanTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - scanTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total QR Codes</p>
                <p className="text-2xl font-bold">{analytics.totalQRCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coverage</p>
                <p className="text-2xl font-bold">{analytics.qrCoverage}%</p>
              </div>
            </div>
            <Progress value={analytics.qrCoverage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Scan className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold">
                  {Object.values(analytics.scansByCategory).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">+24%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scans by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Scans by Category
            </CardTitle>
            <CardDescription>QR code usage across asset categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.scansByCategory).map(([category, scans]) => {
              const maxScans = Math.max(...Object.values(analytics.scansByCategory))
              const percentage = (scans / maxScans) * 100

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{category.replace("-", " ")}</span>
                    <Badge variant="outline">{scans} scans</Badge>
                  </div>
                  <Progress value={percentage} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Scans by Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Scans by Location
            </CardTitle>
            <CardDescription>QR code usage across locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.scansByLocation).map(([location, scans]) => {
              const maxScans = Math.max(...Object.values(analytics.scansByLocation))
              const percentage = (scans / maxScans) * 100

              return (
                <div key={location} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{location}</span>
                    <Badge variant="outline">{scans} scans</Badge>
                  </div>
                  <Progress value={percentage} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent QR Scans
          </CardTitle>
          <CardDescription>Latest QR code scan activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentScans.map((scan, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{scan.assetName}</p>
                  <p className="text-xs text-gray-500">
                    {scan.assetId} • {scan.location}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">Scanned</Badge>
                  <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(scan.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
