"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Package,
  QrCode,
  BarChart3,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Eye,
  Plus,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Clock,
  MapPin,
  Tag,
  DollarSign,
  Shield,
  ExternalLink,
} from "lucide-react"

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="h-10 w-10 mr-4 text-blue-600" />
            User Guide
          </h1>
          <p className="text-xl text-gray-600">Complete guide to using your Asset Management System effectively</p>
        </div>

        <Tabs defaultValue="assets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
            <TabsTrigger value="search">Search & Filter</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="tips">Tips & Tricks</TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Management</CardTitle>
                  <CardDescription>Learn how to create, edit, and manage your assets effectively</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Plus className="h-5 w-5 mr-2 text-green-600" />
                      Creating New Assets
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h5 className="font-medium">Required Information</h5>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              Asset name (descriptive and unique)
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              Category selection
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              Current location
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <h5 className="font-medium">Optional Information</h5>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                              <Tag className="h-4 w-4 text-blue-600 mr-2" />
                              Detailed description
                            </li>
                            <li className="flex items-center">
                              <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                              Purchase value
                            </li>
                            <li className="flex items-center">
                              <Clock className="h-4 w-4 text-blue-600 mr-2" />
                              Purchase date
                            </li>
                          </ul>
                        </div>
                      </div>

                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Pro Tip:</strong> Use consistent naming conventions like "Brand - Model - Identifier"
                          for easier searching.
                        </AlertDescription>
                      </Alert>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">Asset Categories</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Badge variant="outline">IT Equipment</Badge>
                          <Badge variant="outline">Furniture</Badge>
                          <Badge variant="outline">Vehicles</Badge>
                          <Badge variant="outline">Tools</Badge>
                          <Badge variant="outline">AV Equipment</Badge>
                          <Badge variant="outline">Office Supplies</Badge>
                          <Badge variant="outline">Machinery</Badge>
                          <Badge variant="outline">Other</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Edit className="h-5 w-5 mr-2 text-blue-600" />
                      Editing Assets
                    </h4>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Keep your asset information up-to-date by regularly editing asset details:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <MapPin className="h-6 w-6 text-orange-600 mb-2" />
                          <h5 className="font-medium">Location Updates</h5>
                          <p className="text-sm text-gray-600">
                            Update asset location when moved between offices or departments
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Settings className="h-6 w-6 text-purple-600 mb-2" />
                          <h5 className="font-medium">Status Changes</h5>
                          <p className="text-sm text-gray-600">
                            Mark assets as active, inactive, under maintenance, or retired
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Tag className="h-6 w-6 text-green-600 mb-2" />
                          <h5 className="font-medium">Information Updates</h5>
                          <p className="text-sm text-gray-600">
                            Add new details, update descriptions, or modify categories
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-indigo-600" />
                      Asset Status Management
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h5 className="font-medium">Available Statuses</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 border rounded">
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                            <span className="text-sm text-gray-600">In use and available</span>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
                            <span className="text-sm text-gray-600">Under repair or service</span>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                            <span className="text-sm text-gray-600">Not currently in use</span>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <Badge className="bg-red-100 text-red-800">Retired</Badge>
                            <span className="text-sm text-gray-600">End of lifecycle</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h5 className="font-medium">Best Practices</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• Update status immediately when changes occur</li>
                          <li>• Use maintenance status for temporary unavailability</li>
                          <li>• Retire assets that are no longer usable</li>
                          <li>• Keep inactive assets for potential future use</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bulk Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">Efficiently manage multiple assets at once using bulk operations:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <Upload className="h-6 w-6 text-blue-600 mb-2" />
                        <h5 className="font-medium">Bulk Import</h5>
                        <p className="text-sm text-gray-600">Import multiple assets from CSV files</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <Edit className="h-6 w-6 text-green-600 mb-2" />
                        <h5 className="font-medium">Bulk Edit</h5>
                        <p className="text-sm text-gray-600">Update multiple assets simultaneously</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <QrCode className="h-6 w-6 text-purple-600 mb-2" />
                        <h5 className="font-medium">Bulk QR Generation</h5>
                        <p className="text-sm text-gray-600">Generate QR codes for multiple assets</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="qr-codes">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Management</CardTitle>
                  <CardDescription>Complete guide to generating, printing, and scanning QR codes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                      Generating QR Codes
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium mb-3">Individual QR Codes</h5>
                          <ol className="space-y-2 text-sm text-gray-600">
                            <li>1. Navigate to the asset details page</li>
                            <li>2. Click "Generate QR Code" button</li>
                            <li>3. Choose size and format options</li>
                            <li>4. Download the QR code image</li>
                            <li>5. Print and attach to the asset</li>
                          </ol>
                        </div>
                        <div>
                          <h5 className="font-medium mb-3">Bulk QR Generation</h5>
                          <ol className="space-y-2 text-sm text-gray-600">
                            <li>1. Go to QR Management page</li>
                            <li>2. Select multiple assets</li>
                            <li>3. Click "Generate QR Codes"</li>
                            <li>4. Download as ZIP file</li>
                            <li>5. Print all codes at once</li>
                          </ol>
                        </div>
                      </div>

                      <Alert>
                        <QrCode className="h-4 w-4" />
                        <AlertDescription>
                          <strong>QR Code Formats:</strong> Available in PNG, SVG, and PDF formats. SVG is recommended
                          for high-quality printing.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">QR Code Customization</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h5 className="font-medium">Size Options</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Small (128x128px)</span>
                            <Badge variant="outline">Labels</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Medium (256x256px)</span>
                            <Badge variant="outline">Standard</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Large (512x512px)</span>
                            <Badge variant="outline">Posters</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h5 className="font-medium">Print Templates</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• Asset labels with QR code and name</li>
                          <li>• QR code only (minimal design)</li>
                          <li>• Full asset information cards</li>
                          <li>• Custom templates with logo</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Scanning QR Codes</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg text-center">
                          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <QrCode className="h-6 w-6 text-blue-600" />
                          </div>
                          <h5 className="font-medium">Built-in Scanner</h5>
                          <p className="text-sm text-gray-600">Use the app's built-in QR scanner for best results</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Eye className="h-6 w-6 text-green-600" />
                          </div>
                          <h5 className="font-medium">Camera App</h5>
                          <p className="text-sm text-gray-600">Most smartphone cameras can scan QR codes directly</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Settings className="h-6 w-6 text-purple-600" />
                          </div>
                          <h5 className="font-medium">Third-party Apps</h5>
                          <p className="text-sm text-gray-600">Compatible with popular QR scanner apps</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">What Happens When You Scan?</h5>
                        <ul className="space-y-1 text-sm text-blue-800">
                          <li>• Instant access to asset details</li>
                          <li>• Scan location and timestamp recorded</li>
                          <li>• Option to update asset status</li>
                          <li>• Add notes or comments</li>
                          <li>• View scan history</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>QR Code Best Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-3 text-green-800">Do's</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                            Place QR codes in easily accessible locations
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                            Use protective lamination for outdoor assets
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                            Ensure adequate lighting for scanning
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                            Test QR codes after printing
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-3 text-red-800">Don'ts</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                            Don't place codes on curved or reflective surfaces
                          </li>
                          <li className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                            Avoid areas prone to damage or wear
                          </li>
                          <li className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                            Don't make QR codes too small to scan
                          </li>
                          <li className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                            Avoid low-contrast color combinations
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="search">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search and Filtering</CardTitle>
                  <CardDescription>Master the search and filtering capabilities to find assets quickly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Search className="h-5 w-5 mr-2 text-blue-600" />
                      Basic Search
                    </h4>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Use the search bar to quickly find assets by name, description, or ID:
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">Search Tips</h5>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• Search is case-insensitive</li>
                          <li>• Partial matches are supported</li>
                          <li>• Use quotes for exact phrases: "MacBook Pro"</li>
                          <li>• Search across all asset fields</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Filter className="h-5 w-5 mr-2 text-purple-600" />
                      Advanced Filtering
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-3">Available Filters</h5>
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium text-sm">Category</div>
                            <div className="text-xs text-gray-600">Filter by asset category</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium text-sm">Status</div>
                            <div className="text-xs text-gray-600">Active, inactive, maintenance, retired</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium text-sm">Location</div>
                            <div className="text-xs text-gray-600">Filter by current location</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium text-sm">Date Range</div>
                            <div className="text-xs text-gray-600">Created or modified dates</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-3">Filter Combinations</h5>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="font-medium text-sm text-blue-900">Example 1</div>
                            <div className="text-xs text-blue-700">Category: IT Equipment + Status: Active</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="font-medium text-sm text-green-900">Example 2</div>
                            <div className="text-xs text-green-700">Location: Office A + Date: Last 30 days</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="font-medium text-sm text-purple-900">Example 3</div>
                            <div className="text-xs text-purple-700">Status: Maintenance + Category: Vehicles</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Saved Searches</h4>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Save frequently used search and filter combinations for quick access:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">IT Equipment - Active</h5>
                          <p className="text-sm text-gray-600">All active IT equipment</p>
                          <Badge variant="outline" className="mt-2">
                            12 assets
                          </Badge>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">Maintenance Required</h5>
                          <p className="text-sm text-gray-600">Assets needing maintenance</p>
                          <Badge variant="outline" className="mt-2">
                            3 assets
                          </Badge>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">New This Month</h5>
                          <p className="text-sm text-gray-600">Recently added assets</p>
                          <Badge variant="outline" className="mt-2">
                            8 assets
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sorting and Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-3">Sorting Options</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• Name (A-Z or Z-A)</li>
                          <li>• Date created (newest or oldest first)</li>
                          <li>• Last modified</li>
                          <li>• Category</li>
                          <li>• Location</li>
                          <li>• Value (high to low or low to high)</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-3">View Options</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• Grid view (cards with images)</li>
                          <li>• List view (compact table format)</li>
                          <li>• Detailed view (expanded information)</li>
                          <li>• Map view (location-based)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reports and Analytics</CardTitle>
                  <CardDescription>Generate comprehensive reports and analyze your asset data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                      Available Reports
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium">Asset Inventory Report</h5>
                        <p className="text-sm text-gray-600 mb-3">Complete list of all assets with details</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">PDF</Badge>
                          <Badge variant="outline">Excel</Badge>
                          <Badge variant="outline">CSV</Badge>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium">Asset Utilization Report</h5>
                        <p className="text-sm text-gray-600 mb-3">Usage patterns and utilization metrics</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">PDF</Badge>
                          <Badge variant="outline">Excel</Badge>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium">QR Code Activity Report</h5>
                        <p className="text-sm text-gray-600 mb-3">QR code scan history and analytics</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">PDF</Badge>
                          <Badge variant="outline">Excel</Badge>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium">Asset Lifecycle Report</h5>
                        <p className="text-sm text-gray-600 mb-3">Asset age, depreciation, and lifecycle status</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">PDF</Badge>
                          <Badge variant="outline">Excel</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Custom Reports</h4>
                    <div className="space-y-4">
                      <p className="text-gray-600">Create custom reports tailored to your specific needs:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <Filter className="h-6 w-6 text-blue-600 mb-2" />
                          <h5 className="font-medium">Filter Data</h5>
                          <p className="text-sm text-gray-600">Choose specific categories, locations, or date ranges</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Settings className="h-6 w-6 text-green-600 mb-2" />
                          <h5 className="font-medium">Select Fields</h5>
                          <p className="text-sm text-gray-600">Include only the data fields you need</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Download className="h-6 w-6 text-purple-600 mb-2" />
                          <h5 className="font-medium">Export Format</h5>
                          <p className="text-sm text-gray-600">Choose from PDF, Excel, CSV, or JSON formats</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Scheduled Reports</h4>
                    <div className="space-y-4">
                      <p className="text-gray-600">Set up automatic report generation and delivery:</p>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">Schedule Options</h5>
                        <ul className="space-y-1 text-sm text-blue-800">
                          <li>• Daily reports (sent every morning)</li>
                          <li>• Weekly summaries (sent every Monday)</li>
                          <li>• Monthly comprehensive reports</li>
                          <li>• Quarterly business reviews</li>
                          <li>• Custom intervals</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Real-time Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">Monitor your assets in real-time with interactive dashboards:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h5 className="font-medium">Key Metrics</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• Total asset count</li>
                          <li>• Asset utilization rates</li>
                          <li>• QR code scan frequency</li>
                          <li>• Asset status distribution</li>
                          <li>• Location-based analytics</li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h5 className="font-medium">Interactive Charts</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• Asset growth over time</li>
                          <li>• Category distribution pie charts</li>
                          <li>• Location heat maps</li>
                          <li>• Usage trend lines</li>
                          <li>• Maintenance schedules</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure your system preferences and account settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-gray-600" />
                      Account Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">Profile Information</h5>
                          <p className="text-sm text-gray-600 mb-3">Update your name, email, and contact details</p>
                          <Button variant="outline" size="sm">
                            Edit Profile
                          </Button>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">Password & Security</h5>
                          <p className="text-sm text-gray-600 mb-3">
                            Change password and enable two-factor authentication
                          </p>
                          <Button variant="outline" size="sm">
                            Security Settings
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">Notifications</h5>
                          <p className="text-sm text-gray-600 mb-3">
                            Configure email and in-app notification preferences
                          </p>
                          <Button variant="outline" size="sm">
                            Notification Settings
                          </Button>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">API Access</h5>
                          <p className="text-sm text-gray-600 mb-3">Generate and manage API keys for integrations</p>
                          <Button variant="outline" size="sm">
                            API Keys
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">System Preferences</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">Default Categories</h5>
                          <p className="text-sm text-gray-600 mb-3">Customize asset categories for your organization</p>
                          <div className="space-y-2">
                            <Badge variant="outline">IT Equipment</Badge>
                            <Badge variant="outline">Furniture</Badge>
                            <Badge variant="outline">Vehicles</Badge>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">Location Management</h5>
                          <p className="text-sm text-gray-600 mb-3">Set up and manage your organization's locations</p>
                          <div className="space-y-2">
                            <Badge variant="outline">Office A</Badge>
                            <Badge variant="outline">Warehouse</Badge>
                            <Badge variant="outline">Remote</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Team Management</h4>
                    <div className="space-y-4">
                      <p className="text-gray-600">Manage team members and their access permissions:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">Admin</h5>
                          <p className="text-sm text-gray-600">Full system access and management capabilities</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">Manager</h5>
                          <p className="text-sm text-gray-600">Asset management and team oversight</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium">User</h5>
                          <p className="text-sm text-gray-600">Basic asset viewing and QR scanning</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tips">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tips and Best Practices</CardTitle>
                  <CardDescription>Expert tips to maximize your asset management efficiency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                      Asset Organization Tips
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h5 className="font-medium text-green-900">Naming Conventions</h5>
                          <p className="text-sm text-green-800 mt-1">
                            Use consistent naming: "Brand - Model - Location - Number"
                          </p>
                          <p className="text-xs text-green-700 mt-2">Example: "Dell - Laptop - OfficeA - 001"</p>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h5 className="font-medium text-blue-900">Category Structure</h5>
                          <p className="text-sm text-blue-800 mt-1">
                            Create hierarchical categories for better organization
                          </p>
                          <p className="text-xs text-blue-700 mt-2">
                            Example: IT Equipment → Laptops → Business Laptops
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h5 className="font-medium text-purple-900">Regular Updates</h5>
                          <p className="text-sm text-purple-800 mt-1">
                            Schedule monthly reviews to update asset information
                          </p>
                          <p className="text-xs text-purple-700 mt-2">
                            Check locations, status, and condition regularly
                          </p>
                        </div>
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <h5 className="font-medium text-orange-900">Documentation</h5>
                          <p className="text-sm text-orange-800 mt-1">
                            Include purchase receipts and warranty information
                          </p>
                          <p className="text-xs text-orange-700 mt-2">
                            Upload photos and documents for complete records
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">QR Code Optimization</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                          <h5 className="font-medium">Placement Strategy</h5>
                          <p className="text-sm text-gray-600">
                            Place QR codes where they're easily visible and accessible
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Eye className="h-6 w-6 text-blue-600 mb-2" />
                          <h5 className="font-medium">Size Matters</h5>
                          <p className="text-sm text-gray-600">
                            Use appropriate sizes - minimum 2cm x 2cm for reliable scanning
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Shield className="h-6 w-6 text-purple-600 mb-2" />
                          <h5 className="font-medium">Protection</h5>
                          <p className="text-sm text-gray-600">
                            Use lamination or protective covers for outdoor or high-wear assets
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Workflow Optimization</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h5 className="font-medium">Daily Tasks</h5>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                              <Clock className="h-4 w-4 text-blue-600 mr-2" />
                              Check dashboard for new alerts
                            </li>
                            <li className="flex items-center">
                              <QrCode className="h-4 w-4 text-purple-600 mr-2" />
                              Scan assets during routine checks
                            </li>
                            <li className="flex items-center">
                              <Edit className="h-4 w-4 text-green-600 mr-2" />
                              Update asset locations as needed
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <h5 className="font-medium">Weekly Tasks</h5>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                              <BarChart3 className="h-4 w-4 text-orange-600 mr-2" />
                              Review analytics and reports
                            </li>
                            <li className="flex items-center">
                              <Package className="h-4 w-4 text-blue-600 mr-2" />
                              Audit high-value assets
                            </li>
                            <li className="flex items-center">
                              <Settings className="h-4 w-4 text-gray-600 mr-2" />
                              Update maintenance schedules
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Pro Tip:</strong> Set up automated workflows and notifications to reduce manual tasks and
                      ensure nothing falls through the cracks.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting Common Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-3">QR Code Issues</h5>
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg">
                            <h6 className="font-medium text-sm">QR Code Won't Scan</h6>
                            <ul className="text-xs text-gray-600 mt-1 space-y-1">
                              <li>• Check lighting conditions</li>
                              <li>• Clean the QR code surface</li>
                              <li>• Try different scanning angles</li>
                              <li>• Ensure code isn't damaged</li>
                            </ul>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <h6 className="font-medium text-sm">Wrong Asset Information</h6>
                            <ul className="text-xs text-gray-600 mt-1 space-y-1">
                              <li>• Verify QR code placement</li>
                              <li>• Check for duplicate codes</li>
                              <li>• Regenerate if necessary</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-3">System Issues</h5>
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg">
                            <h6 className="font-medium text-sm">Slow Performance</h6>
                            <ul className="text-xs text-gray-600 mt-1 space-y-1">
                              <li>• Clear browser cache</li>
                              <li>• Check internet connection</li>
                              <li>• Use supported browsers</li>
                              <li>• Contact support if persistent</li>
                            </ul>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <h6 className="font-medium text-sm">Data Not Syncing</h6>
                            <ul className="text-xs text-gray-600 mt-1 space-y-1">
                              <li>• Refresh the page</li>
                              <li>• Check network connectivity</li>
                              <li>• Verify user permissions</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Help and Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
            <CardDescription>Additional resources and support options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 justify-start">
                <div className="text-left">
                  <div className="font-semibold">Video Tutorials</div>
                  <div className="text-sm text-gray-600">Step-by-step video guides</div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
              <Button variant="outline" className="h-auto p-4 justify-start">
                <div className="text-left">
                  <div className="font-semibold">Community Forum</div>
                  <div className="text-sm text-gray-600">Get help from other users</div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
              <Button variant="outline" className="h-auto p-4 justify-start">
                <div className="text-left">
                  <div className="font-semibold">Contact Support</div>
                  <div className="text-sm text-gray-600">Direct help from our team</div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
