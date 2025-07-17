"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QrCode, Scan, Download, Upload, Package, BarChart3, Settings, Printer, AlertCircle } from "lucide-react"
import QRGenerator from "@/components/qr-generator"
import QRScanner from "@/components/qr-scanner"
import BulkQROperations from "@/components/bulk-qr-operations"
import { createClient } from "@/lib/supabase/client"
import { Switch } from "@/components/ui/switch"
import QRImageUpload from "@/components/qr-image-upload"
import { toast } from "@/components/ui/use-toast"
import QRTemplateDesigner from "@/components/qr-template-designer"

export default function QRManagementPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [qrStats, setQrStats] = useState({
    totalAssets: 0,
    assetsWithQR: 0,
    qrCoverage: 0,
    recentScans: 0,
  })
  const [settings, setSettings] = useState({
    autoGenerate: false,
    includeDetails: true,
    trackAnalytics: true,
    mobileNotifications: false,
    defaultSize: "300",
    errorCorrection: "M",
    defaultFormat: "png"
  })

  // Fetch assets from Supabase
  const fetchAssets = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("assets")
        .select("id, asset_id, name, category, status, qr_code")
        .order("created_at", { ascending: false })
      if (error) {
        console.error("Failed to fetch assets:", error)
        setAssets([])
      } else {
        setAssets(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    // Calculate QR statistics
    const totalAssets = assets.length
    const assetsWithQR = assets.filter((asset) => asset.qr_code).length
    const qrCoverage = totalAssets > 0 ? Math.round((assetsWithQR / totalAssets) * 100) : 0

    setQrStats({
      totalAssets,
      assetsWithQR,
      qrCoverage,
      recentScans: 12, // Mock data
    })
  }, [assets])

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('qrSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('qrSettings', JSON.stringify(settings))
  }, [settings])

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    // Apply settings immediately
    if (key === 'autoGenerate') {
      // Update auto-generate setting in Supabase
      updateAutoGenerateSettings(value)
    }
  }

  const updateAutoGenerateSettings = async (enabled: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'qr_auto_generate', 
          value: enabled,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Settings Updated",
        description: `Auto-generate QR codes ${enabled ? 'enabled' : 'disabled'}`,
      })
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast({
        title: "Settings Update Failed",
        description: "Failed to save auto-generate settings",
        variant: "destructive"
      })
    }
  }

  const handleQRImageUploaded = async (assetId: string, imageUrl: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('assets')
        .update({ 
          qr_code: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('asset_id', assetId)

      if (error) throw error

      toast({
        title: "QR Code Updated",
        description: "Asset QR code has been updated successfully",
      })

      // Refresh assets list
      fetchAssets()
    } catch (error) {
      console.error('Failed to update asset:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update asset QR code",
        variant: "destructive"
      })
    }
  }

  // Re-fetch assets after QR code generation
  const handleQRGenerated = async (assetId: string, qrCode: string) => {
    await fetchAssets()
  }

  const handleBulkQRGenerated = async (results: any[]) => {
    await fetchAssets()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Management</h1>
          <p className="text-gray-600">Generate, scan, and manage QR codes for your assets</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold">{qrStats.totalAssets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <QrCode className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">QR Codes</p>
                  <p className="text-2xl font-bold">{qrStats.assetsWithQR}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Coverage</p>
                  <p className="text-2xl font-bold">{qrStats.qrCoverage}%</p>
                </div>
              </div>
              <Progress value={qrStats.qrCoverage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Scan className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Scans</p>
                  <p className="text-2xl font-bold">{qrStats.recentScans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="scan">Scan</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Status</CardTitle>
                  <CardDescription>Current QR code coverage across your assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Assets with QR codes</span>
                      <Badge variant="default">{qrStats.assetsWithQR}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Assets without QR codes</span>
                      <Badge variant="secondary">{qrStats.totalAssets - qrStats.assetsWithQR}</Badge>
                    </div>
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Coverage Progress</span>
                        <span className="text-sm text-gray-600">{qrStats.qrCoverage}%</span>
                      </div>
                      <Progress value={qrStats.qrCoverage} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common QR code operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => setActiveTab("generate")}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("scan")}>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan QR Code
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("bulk")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Operations
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Printer className="h-4 w-4 mr-2" />
                    Print QR Labels
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export QR Report
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent QR Activity</CardTitle>
                <CardDescription>Latest QR code generations and scans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">QR code generated for AST-001</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                    <Badge variant="outline">Generated</Badge>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Asset AST-002 scanned</p>
                      <p className="text-xs text-gray-500">15 minutes ago</p>
                    </div>
                    <Badge variant="outline">Scanned</Badge>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Bulk QR generation completed</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                    <Badge variant="outline">Bulk</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QRGenerator assets={assets} onQRGenerated={handleQRGenerated} settings={settings} />
              <QRImageUpload onUploadComplete={handleQRImageUploaded} />
            </div>
          </TabsContent>

          <TabsContent value="scan">
            <QRScanner
              onScanSuccess={(data) => {
                console.log("QR scan successful:", data)
                // Handle successful scan - could navigate to asset page
              }}
              onScanError={(error) => {
                console.error("QR scan error:", error)
                // Handle scan error
              }}
            />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkQROperations assets={assets} onBulkGenerated={handleBulkQRGenerated} />
          </TabsContent>

          <TabsContent value="templates">
            <QRTemplateDesigner />
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    QR Code Settings
                  </CardTitle>
                  <CardDescription>Configure default QR code generation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Size</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={settings.defaultSize}
                      onChange={(e) => handleSettingChange('defaultSize', e.target.value)}
                    >
                      <option value="200">200x200 px</option>
                      <option value="300">300x300 px</option>
                      <option value="400">400x400 px</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Error Correction Level</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={settings.errorCorrection}
                      onChange={(e) => handleSettingChange('errorCorrection', e.target.value)}
                    >
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Format</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={settings.defaultFormat}
                      onChange={(e) => handleSettingChange('defaultFormat', e.target.value)}
                    >
                      <option value="png">PNG</option>
                      <option value="svg">SVG</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integration Settings</CardTitle>
                  <CardDescription>Configure QR code integrations and features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-generate QR codes</p>
                      <p className="text-sm text-gray-600">Automatically create QR codes for new assets</p>
                    </div>
                    <Switch 
                      checked={settings.autoGenerate}
                      onCheckedChange={(checked) => handleSettingChange('autoGenerate', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Include asset details</p>
                      <p className="text-sm text-gray-600">Embed asset information in QR codes</p>
                    </div>
                    <Switch 
                      checked={settings.includeDetails}
                      onCheckedChange={(checked) => handleSettingChange('includeDetails', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Track scan analytics</p>
                      <p className="text-sm text-gray-600">Monitor QR code usage and scans</p>
                    </div>
                    <Switch 
                      checked={settings.trackAnalytics}
                      onCheckedChange={(checked) => handleSettingChange('trackAnalytics', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mobile notifications</p>
                      <p className="text-sm text-gray-600">Send alerts for QR code scans</p>
                    </div>
                    <Switch 
                      checked={settings.mobileNotifications}
                      onCheckedChange={(checked) => handleSettingChange('mobileNotifications', checked)}
                    />
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Settings are automatically saved</p>
                        <p className="text-sm text-blue-600">
                          Your preferences will be applied to all new QR code operations
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
