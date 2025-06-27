"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart3,
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
  Trash2,
  Bell,
  Settings,
  MapPin,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Smartphone,
  Laptop,
  Printer,
  Camera,
} from "lucide-react"
import Link from "next/link"

export default function AssetTrackerPreview() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)

  // Mock data for preview
  const mockUser = {
    email: "demo@assettracker.com",
    full_name: "Demo User",
    role: "admin",
    avatar_url: null,
  }

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
    {
      id: "5",
      asset_id: "AT-005",
      name: "Canon Printer",
      category: "office-equipment",
      status: "retired",
      location: "Storage Room",
      value: 149.99,
      assignee: null,
      created_at: "2024-01-05T16:20:00Z",
      qr_code: "generated",
    },
  ]

  // Calculate analytics
  const analytics = {
    totalAssets: mockAssets.length,
    activeAssets: mockAssets.filter((asset) => asset.status === "active").length,
    maintenanceAssets: mockAssets.filter((asset) => asset.status === "maintenance").length,
    retiredAssets: mockAssets.filter((asset) => asset.status === "retired").length,
    totalValue: mockAssets.reduce((sum, asset) => sum + asset.value, 0),
    utilizationRate: Math.round(
      (mockAssets.filter((asset) => asset.status === "active").length / mockAssets.length) * 100,
    ),
    maintenanceAlerts: mockAssets.filter((asset) => asset.status === "maintenance").length,
    qrCoverage: Math.round((mockAssets.filter((asset) => asset.qr_code).length / mockAssets.length) * 100),
  }

  const filteredAssets = mockAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "maintenance":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "retired":
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4 text-blue-600" />
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

  const UserAvatar = () => (
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
      DU
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AssetTracker Pro</h1>
              <Badge variant="secondary" className="ml-2">
                Preview Mode
              </Badge>
            </div>
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
              <UserAvatar />
              <span className="text-sm font-medium">{mockUser.full_name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-16">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "assets" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("assets")}
            >
              <Package className="h-4 w-4 mr-2" />
              Asset Management
            </Button>
            <Button
              variant={activeTab === "qr" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("qr")}
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code Tools
            </Button>
            <Button
              variant={activeTab === "team" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("team")}
            >
              <Users className="h-4 w-4 mr-2" />
              Team Collaboration
            </Button>
            <Button
              variant={activeTab === "security" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("security")}
            >
              <Shield className="h-4 w-4 mr-2" />
              Security
            </Button>
          </nav>

          {/* Quick Stats in Sidebar */}
          <div className="p-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Assets</span>
                <span className="font-semibold">{analytics.totalAssets}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold text-green-600">{analytics.activeAssets}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">QR Coverage</span>
                <span className="font-semibold text-blue-600">{analytics.qrCoverage}%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                  <p className="text-gray-600">Welcome back, {mockUser.full_name}!</p>
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

              {/* Charts and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Asset Status Distribution</CardTitle>
                    <CardDescription>Current status of all assets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{analytics.activeAssets}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(analytics.activeAssets / analytics.totalAssets) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>Maintenance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{analytics.maintenanceAssets}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(analytics.maintenanceAssets / analytics.totalAssets) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-gray-500" />
                        <span>Retired</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{analytics.retiredAssets}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-500 h-2 rounded-full"
                            style={{ width: `${(analytics.retiredAssets / analytics.totalAssets) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest asset updates and actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New asset added</p>
                          <p className="text-xs text-gray-500">Office Chair (AT-004) • 2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">QR code generated</p>
                          <p className="text-xs text-gray-500">iPhone 14 Pro (AT-002) • 4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Maintenance scheduled</p>
                          <p className="text-xs text-gray-500">Dell Monitor (AT-003) • 1 day ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Asset assigned</p>
                          <p className="text-xs text-gray-500">MacBook Pro to John Doe • 2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts and Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-800">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Maintenance Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-orange-700 mb-3">
                      {analytics.maintenanceAssets} asset{analytics.maintenanceAssets !== 1 ? "s" : ""} require
                      {analytics.maintenanceAssets === 1 ? "s" : ""} attention
                    </p>
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700">
                      View Details
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-800">
                      <QrCode className="h-5 w-5 mr-2" />
                      QR Code Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-700 mb-3">
                      {mockAssets.filter((a) => !a.qr_code).length} asset
                      {mockAssets.filter((a) => !a.qr_code).length !== 1 ? "s" : ""} missing QR codes
                    </p>
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                      Generate QR Codes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-700 mb-3">All systems operational</p>
                    <Button size="sm" variant="outline" className="border-green-300 text-green-700">
                      View Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "assets" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Asset Management</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Asset
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">Filter by Category</Button>
                <Button variant="outline">Filter by Status</Button>
                <Button variant="outline">
                  <Scan className="h-4 w-4 mr-2" />
                  Scan QR
                </Button>
              </div>

              {/* Assets Grid/Table Toggle */}
              <Tabs defaultValue="table" className="w-full">
                <TabsList>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Assets ({filteredAssets.length})</CardTitle>
                      <CardDescription>Manage and track all your assets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>QR Code</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssets.map((asset) => (
                            <TableRow key={asset.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {getCategoryIcon(asset.category)}
                                  </div>
                                  <div>
                                    <p className="font-medium">{asset.name}</p>
                                    <p className="text-sm text-gray-500">{asset.asset_id}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{asset.category.replace("-", " ")}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(asset.status)}
                                  <Badge variant={getStatusVariant(asset.status)} className="capitalize">
                                    {asset.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm">{asset.location}</span>
                                </div>
                              </TableCell>
                              <TableCell>{asset.assignee?.full_name || "Unassigned"}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(asset.value)}</TableCell>
                              <TableCell>
                                {asset.qr_code ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    Generated
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Missing</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedAsset(asset.id)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="grid">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssets.map((asset) => (
                      <Card key={asset.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {getCategoryIcon(asset.category)}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{asset.name}</CardTitle>
                                <p className="text-sm text-gray-500">{asset.asset_id}</p>
                              </div>
                            </div>
                            <Badge variant={getStatusVariant(asset.status)} className="capitalize">
                              {asset.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{asset.location}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Value:</span>
                            <span className="font-semibold">{formatCurrency(asset.value)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Assignee:</span>
                            <span className="text-sm">{asset.assignee?.full_name || "Unassigned"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">QR Code:</span>
                            {asset.qr_code ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Generated
                              </Badge>
                            ) : (
                              <Badge variant="outline">Missing</Badge>
                            )}
                          </div>
                          <div className="flex space-x-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === "qr" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">QR Code Tools</h2>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export QR Report
                  </Button>
                  <Button>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate Bulk QR
                  </Button>
                </div>
              </div>

              {/* QR Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <QrCode className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total QR Codes</p>
                        <p className="text-2xl font-bold">{mockAssets.filter((a) => a.qr_code).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Coverage Rate</p>
                        <p className="text-2xl font-bold">{analytics.qrCoverage}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Missing QR</p>
                        <p className="text-2xl font-bold">{mockAssets.filter((a) => !a.qr_code).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Scan className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Scans Today</p>
                        <p className="text-2xl font-bold">47</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* QR Tools */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <QrCode className="h-5 w-5 mr-2" />
                      QR Code Generator
                    </CardTitle>
                    <CardDescription>Generate QR codes for individual assets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Asset</label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="">Choose an asset...</option>
                        {mockAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name} - {asset.asset_id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">QR code preview will appear here</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Scan className="h-5 w-5 mr-2" />
                      QR Code Scanner
                    </CardTitle>
                    <CardDescription>Scan QR codes to access asset information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">
                        <Camera className="h-4 w-4 mr-2" />
                        Use Camera
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <Scan className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Camera preview would appear here</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>Demo:</strong> Scan functionality works with real camera access when deployed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bulk Operations */}
              <Card>
                <CardHeader>
                  <CardTitle>Bulk QR Operations</CardTitle>
                  <CardDescription>Generate QR codes for multiple assets at once</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Assets without QR codes:</h4>
                      {mockAssets
                        .filter((asset) => !asset.qr_code)
                        .map((asset) => (
                          <div key={asset.id} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">
                              {asset.name} ({asset.asset_id})
                            </span>
                          </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Bulk Actions:</h4>
                      <div className="space-y-2">
                        <Button className="w-full">
                          <QrCode className="h-4 w-4 mr-2" />
                          Generate Selected QR Codes
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Download All as ZIP
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Package className="h-4 w-4 mr-2" />
                          Print QR Labels
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Team Collaboration</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage team access and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <UserAvatar />
                          <div>
                            <p className="font-medium">{mockUser.full_name}</p>
                            <p className="text-sm text-gray-500">{mockUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Active</Badge>
                          <Badge variant="outline" className="capitalize">
                            {mockUser.role}
                          </Badge>
                        </div>
                      </div>

                      {/* Mock team members */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                            JD
                          </div>
                          <div>
                            <p className="font-medium">John Doe</p>
                            <p className="text-sm text-gray-500">john.doe@company.com</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Active</Badge>
                          <Badge variant="outline">User</Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            JS
                          </div>
                          <div>
                            <p className="font-medium">Jane Smith</p>
                            <p className="text-sm text-gray-500">jane.smith@company.com</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Active</Badge>
                          <Badge variant="outline">Manager</Badge>
                        </div>
                      </div>

                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Invite more team members</h3>
                        <p className="text-gray-500 mb-4">Collaborate with your team on asset management</p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Send Invitation
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Activity</CardTitle>
                    <CardDescription>Recent team actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm">John Doe added new asset</p>
                          <p className="text-xs text-gray-500">MacBook Pro • 2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm">Jane Smith generated QR code</p>
                          <p className="text-xs text-gray-500">iPhone 14 Pro • 4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm">You updated asset status</p>
                          <p className="text-xs text-gray-500">Dell Monitor • 1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Security Settings</h2>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Report
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Authentication & Access
                    </CardTitle>
                    <CardDescription>Manage authentication methods and access control</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Email Authentication</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>GitHub OAuth</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Google OAuth</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Two-Factor Authentication</span>
                        <Badge variant="outline">Optional</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Session Timeout</span>
                        <Badge variant="secondary">24 hours</Badge>
                      </div>
                    </div>
                    <Button className="w-full">Configure Authentication</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Protection</CardTitle>
                    <CardDescription>Enterprise-grade security measures</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Data Encryption</span>
                        <Badge variant="default">AES-256</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Database Security</span>
                        <Badge variant="default">Row Level Security</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Backup Encryption</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Audit Logging</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>GDPR Compliance</span>
                        <Badge variant="default">Compliant</Badge>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Security Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Security Audit Log</CardTitle>
                    <CardDescription>Recent security events and activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">Successful login</p>
                            <p className="text-sm text-gray-500">{mockUser.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default">Success</Badge>
                          <p className="text-xs text-gray-500 mt-1">Just now</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium">Asset access via QR</p>
                            <p className="text-sm text-gray-500">MacBook Pro (AT-001)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">QR Scan</Badge>
                          <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">Password change</p>
                            <p className="text-sm text-gray-500">john.doe@company.com</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default">Security</Badge>
                          <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Asset Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAsset(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const asset = mockAssets.find((a) => a.id === selectedAsset)
                if (!asset) return null
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Asset ID</label>
                        <p className="text-lg font-semibold">{asset.asset_id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-lg">{asset.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Category</label>
                        <p className="text-lg capitalize">{asset.category.replace("-", " ")}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <Badge variant={getStatusVariant(asset.status)} className="capitalize">
                          {asset.status}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-lg">{asset.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Value</label>
                        <p className="text-lg font-semibold">{formatCurrency(asset.value)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Asset
                      </Button>
                      <Button variant="outline">
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
