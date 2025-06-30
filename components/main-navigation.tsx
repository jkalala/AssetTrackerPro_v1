"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import SignOutButton from "@/components/auth/sign-out-button"

interface MainNavigationProps {
  className?: string
}

export default function MainNavigation({ className }: MainNavigationProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const featureCategories = [
    {
      title: "Asset Management",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: [
        {
          name: "Asset Dashboard",
          description: "View and manage all assets",
          href: "/assets",
          icon: Grid3X3,
          status: "active"
        },
        {
          name: "Add New Asset",
          description: "Create new asset entries",
          href: "/add-asset",
          icon: Plus,
          status: "active"
        },
        {
          name: "Asset Search",
          description: "Advanced search and filtering",
          href: "/assets",
          icon: Search,
          status: "active"
        },
        {
          name: "Asset History",
          description: "Track asset lifecycle",
          href: "/assets",
          icon: History,
          status: "active"
        },
        {
          name: "Asset Attachments",
          description: "Manage asset files and documents",
          href: "/assets",
          icon: FileImage,
          status: "active"
        },
        {
          name: "Asset Depreciation",
          description: "Financial tracking and depreciation",
          href: "/assets",
          icon: DollarSign,
          status: "active"
        }
      ]
    },
    {
      title: "QR Code System",
      icon: QrCode,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      features: [
        {
          name: "QR Management",
          description: "Generate and manage QR codes",
          href: "/qr-management",
          icon: QrCode,
          status: "active"
        },
        {
          name: "QR Scanner",
          description: "Scan QR codes with camera",
          href: "/qr-test",
          icon: Eye,
          status: "active"
        },
        {
          name: "Bulk QR Operations",
          description: "Generate multiple QR codes",
          href: "/preview",
          icon: Layers,
          status: "active"
        },
        {
          name: "QR Analytics",
          description: "Track QR code usage",
          href: "/analytics",
          icon: BarChart3,
          status: "active"
        }
      ]
    },
    {
      title: "Geofencing & Location",
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      features: [
        {
          name: "Interactive Maps",
          description: "View assets on interactive maps",
          href: "/asset-tracker-preview",
          icon: Globe,
          status: "active"
        },
        {
          name: "Geofence Management",
          description: "Create and manage geofence zones",
          href: "/asset/geofence-management",
          icon: Navigation,
          status: "active"
        },
        {
          name: "Location History",
          description: "Track asset movement history",
          href: "/assets",
          icon: History,
          status: "active"
        },
        {
          name: "Geofence Alerts",
          description: "Monitor zone entry/exit",
          href: "/assets",
          icon: AlertTriangle,
          status: "active"
        }
      ]
    },
    {
      title: "Analytics & Reporting",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      features: [
        {
          name: "Analytics Dashboard",
          description: "Comprehensive analytics",
          href: "/analytics",
          icon: BarChart3,
          status: "active"
        },
        {
          name: "Real-time Charts",
          description: "Live data visualization",
          href: "/analytics",
          icon: Zap,
          status: "active"
        },
        {
          name: "Activity Feed",
          description: "Live system activity",
          href: "/dashboard",
          icon: Clock,
          status: "active"
        },
        {
          name: "Custom Reports",
          description: "Generate custom reports",
          href: "/analytics",
          icon: FileText,
          status: "active"
        }
      ]
    },
    {
      title: "Bulk Operations",
      icon: Layers,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      features: [
        {
          name: "Bulk Import",
          description: "Import assets from CSV/Excel",
          href: "/assets",
          icon: Upload,
          status: "active"
        },
        {
          name: "Bulk Export",
          description: "Export assets to various formats",
          href: "/assets",
          icon: Download,
          status: "active"
        },
        {
          name: "Bulk QR Generation",
          description: "Generate QR codes for multiple assets",
          href: "/preview",
          icon: QrCode,
          status: "active"
        },
        {
          name: "Bulk Assignment",
          description: "Assign multiple assets to users",
          href: "/assets",
          icon: Users,
          status: "active"
        }
      ]
    },
    {
      title: "System Administration",
      icon: Settings,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      features: [
        {
          name: "Database Management",
          description: "Database tools and scripts",
          href: "/debug-supabase",
          icon: Database,
          status: "active"
        },
        {
          name: "Auth Debug",
          description: "Authentication troubleshooting",
          href: "/auth/debug",
          icon: Shield,
          status: "active"
        },
        {
          name: "Supabase Status",
          description: "Check system status",
          href: "/supabase-test",
          icon: CheckCircle,
          status: "active"
        },
        {
          name: "Environment Debug",
          description: "Environment configuration",
          href: "/debug-urls",
          icon: Settings,
          status: "active"
        }
      ]
    }
  ]

  return (
    <div className={className}>
      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <span>Feature Navigation</span>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Content */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="space-y-6">
          {featureCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex} className={`${category.borderColor} ${category.bgColor}`}>
              <CardHeader>
                <CardTitle className={`flex items-center ${category.color}`}>
                  <category.icon className="h-5 w-5 mr-2" />
                  {category.title}
                </CardTitle>
                <CardDescription>
                  Access all {category.title.toLowerCase()} features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.features.map((feature, featureIndex) => (
                    <Link key={featureIndex} href={feature.href}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <feature.icon className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-sm text-gray-900 truncate">
                                  {feature.name}
                                </h4>
                                <Badge 
                                  variant={feature.status === 'active' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {feature.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access Links */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/assets">Assets</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/analytics">Analytics</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs">Documentation</Link>
              </Button>
            </div>
            <div className="mt-4">
              <Button asChild className="w-full" size="sm">
                <Link href="/features">
                  <Sparkles className="h-4 w-4 mr-2" />
                  View All Features
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center space-x-4">
          {user && <SignOutButton />}
        </div>
      </div>
    </div>
  )
} 