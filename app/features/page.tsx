'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  QrCode,
  BarChart3,
  MapPin,
  Users,
  Settings,
  Database,
  FileText,
  Download,
  Upload,
  Search,
  Shield,
  Globe,
  Zap,
  Layers,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileImage,
  Navigation,
  Building,
  Wrench,
  Eye,
  Plus,
  Grid3X3,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  Star,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const featureCategories = [
    {
      id: 'asset-management',
      title: 'Asset Management',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Complete asset lifecycle management with advanced tracking capabilities',
      features: [
        {
          name: 'Asset Dashboard',
          description: 'Comprehensive view of all assets with filtering and search',
          href: '/assets',
          icon: Grid3X3,
          status: 'active',
          demo: 'View real-time asset data with advanced filtering',
        },
        {
          name: 'Add New Asset',
          description: 'Create detailed asset entries with custom fields',
          href: '/add-asset',
          icon: Plus,
          status: 'active',
          demo: 'Form with validation and file uploads',
        },
        {
          name: 'Asset Search & Filter',
          description: 'Advanced search with multiple criteria',
          href: '/assets',
          icon: Search,
          status: 'active',
          demo: 'Real-time search with filters',
        },
        {
          name: 'Asset History',
          description: 'Complete audit trail of asset changes',
          href: '/assets',
          icon: History,
          status: 'active',
          demo: 'Timeline of all asset modifications',
        },
        {
          name: 'Asset Attachments',
          description: 'File management for asset documentation',
          href: '/assets',
          icon: FileImage,
          status: 'active',
          demo: 'Upload and manage asset files',
        },
        {
          name: 'Asset Depreciation',
          description: 'Financial tracking and depreciation calculations',
          href: '/assets',
          icon: DollarSign,
          status: 'active',
          demo: 'Automated depreciation tracking',
        },
      ],
    },
    {
      id: 'qr-system',
      title: 'QR Code System',
      icon: QrCode,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Advanced QR code generation, scanning, and analytics',
      features: [
        {
          name: 'QR Management',
          description: 'Generate and manage QR codes for assets',
          href: '/qr-management',
          icon: QrCode,
          status: 'active',
          demo: 'Customizable QR code generation',
        },
        {
          name: 'QR Scanner',
          description: 'Camera-based QR code scanning',
          href: '/qr-test',
          icon: Eye,
          status: 'active',
          demo: 'Real-time camera scanning',
        },
        {
          name: 'Bulk QR Operations',
          description: 'Generate QR codes for multiple assets',
          href: '/preview',
          icon: Layers,
          status: 'active',
          demo: 'Batch QR code generation',
        },
        {
          name: 'QR Analytics',
          description: 'Track QR code usage and performance',
          href: '/analytics',
          icon: BarChart3,
          status: 'active',
          demo: 'Usage statistics and trends',
        },
      ],
    },
    {
      id: 'geofencing',
      title: 'Geofencing & Location',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'GPS tracking, geofencing, and location-based alerts',
      features: [
        {
          name: 'Interactive Maps',
          description: 'View assets on interactive maps with real-time data',
          href: '/asset-tracker-preview',
          icon: Globe,
          status: 'active',
          demo: 'Interactive asset mapping',
        },
        {
          name: 'Geofence Management',
          description: 'Create and manage geofence zones',
          href: '/asset/geofence-management',
          icon: Navigation,
          status: 'active',
          demo: 'Polygon-based zone creation',
        },
        {
          name: 'Location History',
          description: 'Track asset movement over time',
          href: '/assets',
          icon: History,
          status: 'active',
          demo: 'Historical location tracking',
        },
        {
          name: 'Geofence Alerts',
          description: 'Real-time zone entry/exit notifications',
          href: '/assets',
          icon: AlertTriangle,
          status: 'active',
          demo: 'Instant boundary alerts',
        },
      ],
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Comprehensive analytics, real-time dashboards, and reporting',
      features: [
        {
          name: 'Analytics Dashboard',
          description: 'Comprehensive analytics and insights',
          href: '/analytics',
          icon: BarChart3,
          status: 'active',
          demo: 'Interactive analytics dashboard',
        },
        {
          name: 'Real-time Charts',
          description: 'Live data visualization and monitoring',
          href: '/analytics',
          icon: Zap,
          status: 'active',
          demo: 'Live chart updates',
        },
        {
          name: 'Activity Feed',
          description: 'Real-time system activity monitoring',
          href: '/dashboard',
          icon: Clock,
          status: 'active',
          demo: 'Live activity stream',
        },
        {
          name: 'Custom Reports',
          description: 'Generate and export custom reports',
          href: '/analytics',
          icon: FileText,
          status: 'active',
          demo: 'Report generation tools',
        },
      ],
    },
    {
      id: 'bulk-operations',
      title: 'Bulk Operations',
      icon: Layers,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: 'Efficient bulk processing for large-scale operations',
      features: [
        {
          name: 'Bulk Import',
          description: 'Import assets from CSV/Excel files',
          href: '/assets',
          icon: Upload,
          status: 'active',
          demo: 'CSV import with validation',
        },
        {
          name: 'Bulk Export',
          description: 'Export assets to various formats',
          href: '/assets',
          icon: Download,
          status: 'active',
          demo: 'Multi-format export options',
        },
        {
          name: 'Bulk QR Generation',
          description: 'Generate QR codes for multiple assets',
          href: '/preview',
          icon: QrCode,
          status: 'active',
          demo: 'Batch QR code creation',
        },
        {
          name: 'Bulk Assignment',
          description: 'Assign multiple assets to users',
          href: '/assets',
          icon: Users,
          status: 'active',
          demo: 'Mass assignment tools',
        },
      ],
    },
    {
      id: 'system-admin',
      title: 'System Administration',
      icon: Settings,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Advanced system administration and debugging tools',
      features: [
        {
          name: 'Database Management',
          description: 'Database tools and migration scripts',
          href: '/debug-supabase',
          icon: Database,
          status: 'active',
          demo: 'Database administration tools',
        },
        {
          name: 'Auth Debug',
          description: 'Authentication troubleshooting',
          href: '/auth/debug',
          icon: Shield,
          status: 'active',
          demo: 'Auth system diagnostics',
        },
        {
          name: 'Supabase Status',
          description: 'Check system status and connectivity',
          href: '/supabase-test',
          icon: CheckCircle,
          status: 'active',
          demo: 'System health monitoring',
        },
        {
          name: 'Environment Debug',
          description: 'Environment configuration tools',
          href: '/debug-urls',
          icon: Settings,
          status: 'active',
          demo: 'Configuration management',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">AssetPro Features</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover all the powerful features available in AssetPro. Each feature is fully
            implemented and ready to use.
          </p>
        </div>

        {/* Feature Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="asset-management">Assets</TabsTrigger>
            <TabsTrigger value="qr-system">QR Codes</TabsTrigger>
            <TabsTrigger value="geofencing">Geofencing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="bulk-operations">Bulk Ops</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Feature Overview
                </CardTitle>
                <CardDescription>
                  All features are fully implemented and production-ready
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featureCategories.map(category => (
                    <Card
                      key={category.id}
                      className={`${category.borderColor} ${category.bgColor}`}
                    >
                      <CardHeader>
                        <CardTitle className={`flex items-center ${category.color}`}>
                          <category.icon className="h-5 w-5 mr-2" />
                          {category.title}
                        </CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Features</span>
                            <Badge variant="default">{category.features.length}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => setActiveTab(category.id)}
                        >
                          <span>View Details</span>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Category Tabs */}
          {featureCategories.map(category => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center ${category.color}`}>
                    <category.icon className="h-6 w-6 mr-3" />
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.features.map((feature, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <feature.icon className="h-8 w-8 text-gray-600 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                                <Badge
                                  variant={feature.status === 'active' ? 'default' : 'secondary'}
                                >
                                  {feature.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <p className="text-xs text-gray-600">
                                  <strong>Demo:</strong> {feature.demo}
                                </p>
                              </div>
                              <Button asChild size="sm" className="w-full">
                                <Link href={feature.href}>
                                  Access Feature
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Access */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Access
            </CardTitle>
            <CardDescription>Direct links to main application areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/assets">Assets</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/analytics">Analytics</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/docs">Documentation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
