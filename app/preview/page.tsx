"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  QrCode,
  Scan,
  Package,
  Download,
  CheckCircle,
  Eye,
  Settings,
  BarChart3,
  Shield,
  Zap,
  Smartphone,
  Globe,
} from "lucide-react"
import QRGenerator from "@/components/qr-generator"
import QRScanner from "@/components/qr-scanner"
import BulkQROperations from "@/components/bulk-qr-operations"

export default function PreviewPage() {
  const [activeDemo, setActiveDemo] = useState("overview")

  // Mock data for demonstration
  const mockAssets = [
    {
      id: "1",
      asset_id: "DEMO-001",
      name: 'MacBook Pro 16"',
      category: "it-equipment",
      status: "active",
      location: "Office A - Desk 12",
      value: 2499.99,
      qr_code: null,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      assignee: { full_name: "John Doe" },
    },
    {
      id: "2",
      asset_id: "DEMO-002",
      name: "Ergonomic Office Chair",
      category: "furniture",
      status: "active",
      location: "Office A - Desk 12",
      value: 299.99,
      qr_code:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-10T09:00:00Z",
      assignee: { full_name: "Jane Smith" },
    },
    {
      id: "3",
      asset_id: "DEMO-003",
      name: "4K Projector",
      category: "av-equipment",
      status: "maintenance",
      location: "Conference Room B",
      value: 899.99,
      qr_code: null,
      created_at: "2024-01-05T14:30:00Z",
      updated_at: "2024-01-20T11:15:00Z",
      assignee: null,
    },
  ]

  const qrStats = {
    totalAssets: mockAssets.length,
    withQR: mockAssets.filter((a) => a.qr_code).length,
    withoutQR: mockAssets.filter((a) => !a.qr_code).length,
    qrCoverage: Math.round((mockAssets.filter((a) => a.qr_code).length / mockAssets.length) * 100),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AssetTracker Pro - QR Code System</h1>
              <p className="text-gray-600 mt-1">Complete QR code functionality for asset management</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Live Preview
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Overview */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <QrCode className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-800">QR Codes Generated</p>
                    <p className="text-2xl font-bold text-blue-900">{qrStats.withQR}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-800">Assets Tracked</p>
                    <p className="text-2xl font-bold text-green-900">{qrStats.totalAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-800">QR Coverage</p>
                    <p className="text-2xl font-bold text-purple-900">{qrStats.qrCoverage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Scan className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-orange-800">Scans Today</p>
                    <p className="text-2xl font-bold text-orange-900">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Demo Tabs */}
        <Tabs value={activeDemo} onValueChange={setActiveDemo} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Ops</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    QR Code System Overview
                  </CardTitle>
                  <CardDescription>Complete asset tagging and identification solution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Individual QR code generation with customization</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Bulk QR code creation for multiple assets</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Camera-based and image upload scanning</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Real-time asset lookup and information display</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Mobile-optimized asset detail pages</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Secure QR data with timestamp verification</span>
                    </div>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Live System:</strong> All QR code features are fully functional and ready for production
                      use.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Asset with QR Code</CardTitle>
                  <CardDescription>Example of how QR codes integrate with your assets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{mockAssets[1].name}</h4>
                        <p className="text-sm text-gray-600">ID: {mockAssets[1].asset_id}</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <p className="capitalize">{mockAssets[1].category}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <p>{mockAssets[1].location}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Assignee:</span>
                        <p>{mockAssets[1].assignee?.full_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Value:</span>
                        <p>${mockAssets[1].value}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <div className="inline-block p-2 bg-white border rounded">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">QR Code for instant access</p>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Asset Details
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Technology Stack */}
            <Card>
              <CardHeader>
                <CardTitle>Technology & Implementation</CardTitle>
                <CardDescription>Built with modern web technologies for reliability and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Core Technologies
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Next.js 14 with App Router</li>
                      <li>• TypeScript for type safety</li>
                      <li>• QRCode.js for generation</li>
                      <li>• Canvas API for processing</li>
                      <li>• Supabase for data storage</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mobile Features
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Responsive design</li>
                      <li>• Camera API integration</li>
                      <li>• Touch-friendly interface</li>
                      <li>• Offline QR viewing</li>
                      <li>• Progressive Web App ready</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Security & Reliability
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Encrypted QR data format</li>
                      <li>• Timestamp verification</li>
                      <li>• Error correction levels</li>
                      <li>• Input validation</li>
                      <li>• Audit trail logging</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Generator Demo</CardTitle>
                <CardDescription>Generate QR codes for individual assets with customizable options</CardDescription>
              </CardHeader>
              <CardContent>
                <QRGenerator assets={mockAssets} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Scanner Demo</CardTitle>
                <CardDescription>
                  Scan QR codes using camera or upload images to access asset information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRScanner
                  onScanSuccess={(data) => {
                    console.log("Demo scan successful:", data)
                  }}
                  onScanError={(error) => {
                    console.error("Demo scan error:", error)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Operations Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk QR Operations Demo</CardTitle>
                <CardDescription>Generate QR codes for multiple assets simultaneously</CardDescription>
              </CardHeader>
              <CardContent>
                <BulkQROperations assets={mockAssets} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    Generation Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Individual Generation</h4>
                        <p className="text-sm text-gray-600">Create QR codes for single assets with custom settings</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Bulk Processing</h4>
                        <p className="text-sm text-gray-600">Generate multiple QR codes simultaneously</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Customization Options</h4>
                        <p className="text-sm text-gray-600">Adjust size, colors, and error correction levels</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Multiple Formats</h4>
                        <p className="text-sm text-gray-600">Export as PNG, SVG, or PDF formats</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scan className="h-5 w-5 mr-2" />
                    Scanning Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Camera Scanning</h4>
                        <p className="text-sm text-gray-600">Real-time QR code detection using device camera</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Image Upload</h4>
                        <p className="text-sm text-gray-600">Scan QR codes from uploaded images</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Instant Lookup</h4>
                        <p className="text-sm text-gray-600">Immediate asset information retrieval</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Mobile Optimized</h4>
                        <p className="text-sm text-gray-600">Works seamlessly on mobile devices</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Asset Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Direct Asset Links</h4>
                        <p className="text-sm text-gray-600">QR codes link directly to asset detail pages</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Real-time Data</h4>
                        <p className="text-sm text-gray-600">Always shows current asset information</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Action Buttons</h4>
                        <p className="text-sm text-gray-600">Quick access to common asset operations</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">History Tracking</h4>
                        <p className="text-sm text-gray-600">Audit trail of QR code scans and access</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Advanced Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">CSV Import/Export</h4>
                        <p className="text-sm text-gray-600">Bulk asset management with spreadsheet integration</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Analytics Dashboard</h4>
                        <p className="text-sm text-gray-600">Track QR code usage and scan statistics</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Security Features</h4>
                        <p className="text-sm text-gray-600">Encrypted data and tamper detection</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">API Integration</h4>
                        <p className="text-sm text-gray-600">RESTful APIs for third-party integrations</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Ready to Transform Your Asset Management?</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                This complete QR code system is ready for production use. Download the code and deploy it to start
                managing your assets with cutting-edge QR technology.
              </p>
              <div className="flex justify-center space-x-4">
                <Button size="lg">
                  <Download className="h-5 w-5 mr-2" />
                  Download Complete Code
                </Button>
                <Button size="lg" variant="outline">
                  <Eye className="h-5 w-5 mr-2" />
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
