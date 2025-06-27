"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  QrCode,
  Shield,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Search,
  Plus,
  Scan,
  Download,
  Eye,
  Edit,
  Bell,
  Settings,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  Smartphone,
  Laptop,
  Printer,
} from "lucide-react"

export default function PreviewDashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data for preview
  const mockAssets = [
    {
      id: "1",
      asset_id: "AT-001",
      name: 'MacBook Pro 16"',
      category: "it-equipment",
      status: "active",
      location: "Office A - Desk 12",
      value: 2499.99,
      assignee: { full_name: "John Doe" },
      created_at: "2024-01-15T10:00:00Z",
      qr_code: "generated",
    },
    {
      id: "2",
      asset_id: "AT-002",
      name: "iPhone 14 Pro",
      category: "mobile-device",
      status: "active",
      location: "Office B - Mobile Pool",
      value: 999.99,
      assignee: { full_name: "Jane Smith" },
      created_at: "2024-01-20T14:30:00Z",
      qr_code: "generated",
    },
    {
      id: "3",
      asset_id: "AT-003",
      name: 'Dell Monitor 27"',
      category: "it-equipment",
      status: "maintenance",
      location: "IT Storage",
      value: 299.99,
      assignee: null,
      created_at: "2024-01-10T09:15:00Z",
      qr_code: "generated",
    },
    {
      id: "4",
      asset_id: "AT-004",
      name: "Office Chair",
      category: "furniture",
      status: "active",
      location: "Office A - Desk 5",
      value: 199.99,
      assignee: { full_name: "Mike Johnson" },
      created_at: "2024-01-25T11:45:00Z",
      qr_code: null,
    },
  ]

  // Calculate analytics
  const analytics = {
    totalAssets: mockAssets.length,
    activeAssets: mockAssets.filter((asset) => asset.status === "active").length,
    maintenanceAssets: mockAssets.filter((asset) => asset.status === "maintenance").length,
    totalValue: mockAssets.reduce((sum, asset) => sum + asset.value, 0),
    utilizationRate: Math.round(
      (mockAssets.filter((asset) => asset.status === "active").length / mockAssets.length) * 100,
    ),
    qrCoverage: Math.round((mockAssets.filter((asset) => asset.qr_code).length / mockAssets.length) * 100),
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "maintenance":
        return "destructive"
      case "retired":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "it-equipment":
        return <Laptop className="h-4 w-4" />
      case "mobile-device":
        return <Smartphone className="h-4 w-4" />
      case "office-equipment":
        return <Printer className="h-4 w-4" />
      case "furniture":
        return <Package className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const filteredAssets = mockAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AssetTracker Pro</h1>
            <Badge variant="secondary" className="ml-2">
              Live Preview
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Code
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                DU
              </div>
              <span className="text-sm font-medium">Demo User</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Welcome to AssetTracker Pro!</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalAssets}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2 this week</span>
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">Portfolio value</span>
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.utilizationRate}%</div>
              <Progress value={analytics.utilizationRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Coverage</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.qrCoverage}%</div>
              <p className="text-xs text-muted-foreground">
                {mockAssets.filter((a) => a.qr_code).length} of {analytics.totalAssets} assets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Asset Management Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Asset Management</h3>
            <Button variant="outline">
              <Scan className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getCategoryIcon(asset.category)}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{asset.name}</CardTitle>
                        <p className="text-xs text-gray-500">{asset.asset_id}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(asset.status)} className="capitalize text-xs">
                      {asset.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{asset.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-semibold">{formatCurrency(asset.value)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Assignee:</span>
                    <span className="truncate">{asset.assignee?.full_name || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">QR Code:</span>
                    {asset.qr_code ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                        Generated
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Missing
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <QrCode className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <QrCode className="h-5 w-5 mr-2" />
                QR Code Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700 mb-3">Generate and manage QR codes for your assets</p>
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                Open QR Tools
              </Button>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Users className="h-5 w-5 mr-2" />
                Team Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-3">Manage team access and permissions</p>
              <Button size="sm" variant="outline" className="border-green-300 text-green-700">
                Manage Team
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Shield className="h-5 w-5 mr-2" />
                Security & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700 mb-3">View security settings and generate reports</p>
              <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
                View Security
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">System Operational</p>
                  <p className="text-sm text-gray-500">All services running normally</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">{analytics.maintenanceAssets} Assets in Maintenance</p>
                  <p className="text-sm text-gray-500">Scheduled maintenance in progress</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{mockAssets.filter((a) => !a.qr_code).length} Missing QR Codes</p>
                  <p className="text-sm text-gray-500">Assets without QR codes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
