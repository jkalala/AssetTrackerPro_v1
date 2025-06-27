"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Package,
  QrCode,
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Settings,
} from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  const demoAssets = [
    {
      id: "DEMO-001",
      name: 'MacBook Pro 16"',
      category: "Electronics",
      status: "Active",
      location: "Office Floor 2",
      lastSeen: "2 hours ago",
      value: "$2,499",
    },
    {
      id: "DEMO-002",
      name: "Office Chair",
      category: "Furniture",
      status: "Maintenance",
      location: "Storage Room",
      lastSeen: "1 day ago",
      value: "$299",
    },
    {
      id: "DEMO-003",
      name: "Projector",
      category: "Electronics",
      status: "Active",
      location: "Conference Room A",
      lastSeen: "30 minutes ago",
      value: "$899",
    },
  ]

  const demoStats = {
    totalAssets: 156,
    activeAssets: 142,
    maintenanceAssets: 8,
    retiredAssets: 6,
    totalValue: "$45,670",
    qrCodesGenerated: 156,
    recentScans: 23,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Demo Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Demo Mode:</strong> This is a demonstration of the Asset Management System with sample data. To
            access the full system with your own data, please{" "}
            <Link href="/login" className="underline font-medium hover:text-amber-900">
              sign in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="underline font-medium hover:text-amber-900">
              create an account
            </Link>
            .
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Asset Management System Demo</h1>
          <p className="text-xl text-gray-600">
            Explore the features and capabilities of our comprehensive asset tracking solution
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Assets</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{demoStats.totalAssets}</div>
              <p className="text-xs text-gray-600">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Active Assets</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{demoStats.activeAssets}</div>
              <p className="text-xs text-gray-600">
                {Math.round((demoStats.activeAssets / demoStats.totalAssets) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{demoStats.totalValue}</div>
              <p className="text-xs text-gray-600">Across all categories</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{demoStats.qrCodesGenerated}</div>
              <p className="text-xs text-gray-600">{demoStats.recentScans} scans this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assets */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Assets
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sample assets in your inventory management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                      <p className="text-sm text-gray-600">
                        ID: {asset.id} • {asset.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{asset.value}</p>
                      <p className="text-xs text-gray-600">{asset.location}</p>
                    </div>
                    <Badge
                      variant={asset.status === "Active" ? "default" : "secondary"}
                      className={
                        asset.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {asset.status}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {asset.lastSeen}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                QR Code Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Generate, scan, and manage QR codes for all your assets with bulk operations and analytics.
              </p>
              <Button variant="outline" className="w-full" disabled>
                <Eye className="h-4 w-4 mr-2" />
                View Demo QR Codes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Real-time Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Track asset utilization, maintenance schedules, and generate comprehensive reports.
              </p>
              <Button variant="outline" className="w-full" disabled>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Demo Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Team Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage user roles, permissions, and track asset assignments across your organization.
              </p>
              <Button variant="outline" className="w-full" disabled>
                <Settings className="h-4 w-4 mr-2" />
                View Demo Users
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Create your account to start managing your assets with our comprehensive tracking system. Set up your
              inventory, generate QR codes, and gain insights into your asset utilization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
