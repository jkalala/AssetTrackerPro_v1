'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  QrCode,
  Users,
  Shield,
  BarChart3,
  Smartphone,
  Cloud,
  Zap,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  MapPin,
  Layers,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const checkAuth = async () => {
      try {
        const { useAuth } = await import('@/components/auth/auth-provider')
        // We'll handle auth checking in a safer way
        setLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [mounted])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AssetTracker Pro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AssetTracker Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/docs" className="text-blue-600 hover:text-blue-800 font-medium">
                Documentation
              </Link>
              <Link href="/qr-management" className="text-blue-600 hover:text-blue-800">
                QR Features
              </Link>
              <a
                href="/login"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 Professional Asset Management System
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Professional Asset
            <span className="text-blue-600"> Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your asset tracking with QR codes, real-time monitoring, and powerful
            analytics. Built for businesses that demand excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-3">
              <Link href="/signup">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-3">
              <a href="/login">
                Sign In <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              ✨ Complete Feature Set
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Asset Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AssetPro comes with a complete suite of features for professional asset tracking, from
              QR codes to geofencing and real-time analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Package,
                title: 'Asset Management',
                description:
                  'Complete lifecycle management with advanced tracking, search, and filtering capabilities.',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                features: [
                  'Asset CRUD Operations',
                  'Advanced Search',
                  'Asset History',
                  'File Attachments',
                  'Depreciation Tracking',
                ],
              },
              {
                icon: QrCode,
                title: 'QR Code System',
                description:
                  'Generate, scan, and manage QR codes with bulk operations and analytics.',
                color: 'text-purple-600',
                bgColor: 'bg-purple-50',
                features: [
                  'QR Generation',
                  'Camera Scanning',
                  'Bulk Operations',
                  'Usage Analytics',
                ],
              },
              {
                icon: MapPin,
                title: 'Geofencing & Location',
                description:
                  'GPS tracking, geofence zones, and location-based alerts and monitoring.',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                features: [
                  'Interactive Maps',
                  'Geofence Zones',
                  'Location History',
                  'Real-time Alerts',
                ],
              },
              {
                icon: BarChart3,
                title: 'Analytics & Reporting',
                description:
                  'Comprehensive analytics, real-time dashboards, and custom reporting tools.',
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                features: [
                  'Real-time Charts',
                  'Activity Feeds',
                  'Custom Reports',
                  'Performance Metrics',
                ],
              },
              {
                icon: Layers,
                title: 'Bulk Operations',
                description: 'Efficient bulk processing for import, export, and mass operations.',
                color: 'text-indigo-600',
                bgColor: 'bg-indigo-50',
                features: [
                  'CSV Import/Export',
                  'Bulk QR Generation',
                  'Mass Assignment',
                  'Data Validation',
                ],
              },
              {
                icon: Settings,
                title: 'System Administration',
                description: 'Advanced administration tools, debugging, and system monitoring.',
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                features: [
                  'Database Management',
                  'Auth Debug',
                  'System Status',
                  'Environment Tools',
                ],
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`${feature.bgColor} border-0 hover:shadow-lg transition-shadow`}
              >
                <CardHeader>
                  <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/features">
                View All Features <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              All features are fully implemented and production-ready
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Asset Management?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join organizations using AssetTracker Pro to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-3">
              <Link href="/signup">
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-3">
              <Link href="/docs">
                <QrCode className="mr-2 h-5 w-5" />
                View Documentation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="h-8 w-8 text-blue-400" />
            <h3 className="text-2xl font-bold">AssetTracker Pro</h3>
          </div>
          <p className="text-gray-400 mb-6">Professional asset management for modern teams</p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link href="/docs" className="text-gray-400 hover:text-white">
              Documentation
            </Link>
            <Link href="/qr-management" className="text-gray-400 hover:text-white">
              Features
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
