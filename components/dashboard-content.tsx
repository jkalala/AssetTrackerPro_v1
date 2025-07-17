"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import AssetDashboard from "@/components/asset-dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  Plus, 
  QrCode, 
  BarChart3, 
  MapPin, 
  Settings, 
  Layers,
  Users,
  Database,
  FileText,
  Download,
  Upload,
  Search,
  Shield,
  Globe,
  Zap,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileImage,
  Navigation,
  Eye,
  Grid3X3,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Building2,
  CreditCard,
  User
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { getAssetStats } from "@/lib/asset-actions"
import { Progress } from "@/components/ui/progress"
import SignOutButton from "@/components/auth/sign-out-button"
import NotificationsBell from "@/components/notifications-bell"
import { useBranding } from "@/components/branding-provider"

interface AssetStats {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  totalValue: number
  recentAdditions?: number
}

function DashboardHeader() {
  const branding = useBranding();
  return (
    <div className="flex items-center space-x-3">
      {branding?.logoUrl && (
        <img src={branding.logoUrl} alt="Logo" className="h-8 w-8 rounded bg-white border" />
      )}
      <h1 className="text-2xl font-bold text-gray-900">
        {branding?.companyName || "AssetTracker Pro"}
      </h1>
    </div>
  );
}

function GeofenceAlertsPanel() {
  const [events, setEvents] = useState<any[]>([])
  const [stats, setStats] = useState({ entries: 0, exits: 0 })
  useEffect(() => {
    const supabase = createClient()
    let subscription: any
    let polling: any
    async function fetchEvents() {
      const since = new Date()
      since.setHours(0,0,0,0)
      const { data } = await supabase
        .from('geofence_events')
        .select('*, asset:asset_id(name), geofence:geofence_id(name)')
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: false })
        .limit(10)
      setEvents(data || [])
      setStats({
        entries: (data || []).filter((ev: any) => ev.event_type === 'entry').length,
        exits: (data || []).filter((ev: any) => ev.event_type === 'exit').length,
      })
    }
    fetchEvents()
    // Try to use Supabase real-time if available
    try {
      subscription = supabase
        .channel('public:geofence_events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'geofence_events' }, fetchEvents)
        .subscribe()
    } catch {
      // Fallback to polling
      polling = setInterval(fetchEvents, 10000)
    }
    return () => {
      if (subscription) supabase.removeChannel(subscription)
      if (polling) clearInterval(polling)
    }
  }, [])
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <span className="font-semibold">Geofence Alerts Today</span>
        <span className="ml-4 text-xs text-gray-500">Entries: {stats.entries} | Exits: {stats.exits}</span>
      </div>
      <div className="space-y-1">
        {events.length === 0 ? (
          <div className="text-xs text-gray-500">No geofence events today.</div>
        ) : events.map((ev: any) => (
          <div key={ev.id} className="flex items-center gap-2 text-xs">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>
              <b>{ev.event_type === 'entry' ? 'Entered' : 'Exited'}</b> <b>{ev.geofence?.name || ev.geofence_id}</b> by <b>{ev.asset?.name || ev.asset_id}</b> at {new Date(ev.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<AssetStats | null>(null)
  const { toast } = useToast()
  const [refreshKey, setRefreshKey] = useState(0);

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      checkProfile()
      fetchStats()
    }
  }, [user, loading, router, mounted])

  const checkProfile = async () => {
    try {
      setError(null)
      console.log("Checking profile for user:", user?.id)

      // Create client with explicit error handling
      let supabase
      try {
        supabase = createClient()
        console.log("Dashboard: Supabase client created successfully")
      } catch (err) {
        console.error("Dashboard: Error creating Supabase client:", err)
        setError("Failed to initialize database connection. Please refresh and try again.")
        setProfileLoading(false)
        return
      }

      // Fetch profile with error handling
      try {
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

        if (error) {
          if (error.code === "PGRST116") {
            console.log("No profile found, redirecting to profile setup")
            router.push("/profile-setup")
            return
          }

          throw error
        }

        console.log("Profile fetched successfully:", profile)
        setProfile(profile)
      } catch (error) {
        console.error("Error fetching profile:", error)
        setError("Failed to load your profile. Please refresh and try again.")
      }
    } catch (error) {
      console.error("Error in checkProfile:", error)
      setError("An unexpected error occurred. Please refresh and try again.")
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await getAssetStats()
      if (result.error) {
        toast({
          title: "Error Loading Stats",
          description: result.error,
          variant: "destructive"
        })
      } else {
        setStats(result.data as AssetStats)
      }
    } catch (error) {
      toast({
        title: "Error Loading Stats",
        description: "Failed to load asset statistics",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    fetchStats();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      maintenance: "bg-amber-100 text-amber-800",
      retired: "bg-gray-100 text-gray-800",
      lost: "bg-red-100 text-red-800",
      damaged: "bg-orange-100 text-orange-800"
    }
    return colors[status as keyof typeof colors] || "bg-blue-100 text-blue-800"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Don't render anything until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Setup Required</CardTitle>
            <CardDescription>Please complete your profile to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/profile-setup">Complete Profile Setup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const featureCategories = [
    {
      id: "asset-management",
      title: "Asset Management",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Complete asset lifecycle management",
      features: [
        { name: "Asset Dashboard", href: "/assets", icon: Grid3X3 },
        { name: "Add New Asset", href: "/add-asset", icon: Plus },
        { name: "Asset Search", href: "/assets", icon: Search },
        { name: "Asset History", href: "/assets", icon: History },
        { name: "Asset Attachments", href: "/assets", icon: FileImage },
        { name: "Asset Depreciation", href: "/assets", icon: DollarSign }
      ]
    },
    {
      id: "qr-system",
      title: "QR Code System",
      icon: QrCode,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Advanced QR code generation and scanning",
      features: [
        { name: "QR Management", href: "/qr-management", icon: QrCode },
        { name: "QR Scanner", href: "/qr-test", icon: Eye },
        { name: "Bulk QR Operations", href: "/preview", icon: Layers },
        { name: "QR Analytics", href: "/analytics", icon: BarChart3 }
      ]
    },
    {
      id: "geofencing",
      title: "Geofencing & Location",
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "GPS tracking and geofence management",
      features: [
        { name: "Interactive Maps", href: "/asset-tracker-preview", icon: Globe },
        { name: "Geofence Management", href: "/asset/geofence-management", icon: Navigation },
        { name: "Location History", href: "/assets", icon: History },
        { name: "Geofence Alerts", href: "/assets", icon: AlertTriangle }
      ]
    },
    {
      id: "analytics",
      title: "Analytics & Reporting",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description: "Comprehensive analytics and reporting",
      features: [
        { name: "Analytics Dashboard", href: "/analytics", icon: BarChart3 },
        { name: "Real-time Charts", href: "/analytics", icon: Zap },
        { name: "Activity Feed", href: "/dashboard", icon: Clock },
        { name: "Custom Reports", href: "/analytics", icon: FileText }
      ]
    },
    {
      id: "bulk-operations",
      title: "Bulk Operations",
      icon: Layers,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      description: "Efficient bulk processing tools",
      features: [
        { name: "Bulk Import", href: "/assets", icon: Upload },
        { name: "Bulk Export", href: "/assets", icon: Download },
        { name: "Bulk QR Generation", href: "/preview", icon: QrCode },
        { name: "Bulk Assignment", href: "/assets", icon: Users }
      ]
    },
    {
      id: "system-admin",
      title: "System Administration",
      icon: Settings,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Advanced system administration tools",
      features: [
        { name: "Organization Settings", href: "/settings/tenant", icon: Building2 },
        { name: "Billing & Plans", href: "/settings/billing", icon: CreditCard },
        { name: "Team Management", href: "/settings/team", icon: Users },
        { name: "Security Settings", href: "/settings/security", icon: Shield }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <DashboardHeader />
            </div>
            <div className="flex items-center space-x-4">
              <NotificationsBell />
              <span className="text-sm text-gray-600">Welcome, {profile.full_name || user.email}</span>
              <Link href="/settings/profile" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                <User className="h-4 w-4" />
                Profile
              </Link>
              <SignOutButton />
              <Button asChild size="sm">
                <Link href="/add-asset">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/add-asset">Add New Asset</Link>
              </Button>
              <Button variant="outline" className="w-full mt-2" onClick={handleRefresh}>
                Refresh Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Management</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/qr-management">Manage QR Codes</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Geofence Alerts Panel */}
        <GeofenceAlertsPanel />

        {/* Main Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
            <TabsTrigger value="features">All Features</TabsTrigger>
          </TabsList>

          {/* Dashboard Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Pass refreshKey as a key to analytics/child components if needed */}
            <AssetDashboard key={refreshKey} />
          </TabsContent>

          {/* All Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">All Features</h2>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Access all the powerful features available in AssetPro. Each feature is fully implemented and ready to use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCategories.map((category, index) => (
                <Card key={index} className={`${category.borderColor} ${category.bgColor} hover:shadow-lg transition-all duration-200 hover:scale-105`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center ${category.color}`}>
                      <category.icon className="h-6 w-6 mr-3" />
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-sm">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.features.map((feature, featureIndex) => (
                        <Link key={featureIndex} href={feature.href}>
                          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors cursor-pointer">
                            <feature.icon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-900">{feature.name}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/features#${category.id}`}>
                          View All {category.title} Features
                          <ArrowRight className="h-3 w-3 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Access Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Access
                </CardTitle>
                <CardDescription>
                  Direct links to main application areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button asChild variant="outline">
                    <Link href="/assets">Assets</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/analytics">Analytics</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/docs">Documentation</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/features">All Features</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Asset Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.recentAdditions || 0} added this month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.byStatus?.active || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.total ? Math.round(((stats.byStatus?.active || 0) / stats.total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats?.byStatus?.maintenance || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Asset portfolio value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Asset Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Asset Status Distribution
              </CardTitle>
              <CardDescription>Breakdown of assets by current status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{count} assets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={stats.total ? (count / stats.total) * 100 : 0} 
                      className="w-20"
                    />
                    <span className="text-sm font-medium">
                      {stats.total ? Math.round((count / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.byStatus || Object.keys(stats.byStatus).length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No assets found</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Asset Categories
              </CardTitle>
              <CardDescription>Assets organized by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.byCategory && Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium capitalize">
                      {category.replace('-', ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">{count} assets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={stats.total ? (count / stats.total) * 100 : 0} 
                      className="w-20"
                    />
                    <span className="text-sm font-medium">
                      {stats.total ? Math.round((count / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.byCategory || Object.keys(stats.byCategory).length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No categories found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common asset management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/add-asset">
                  <Plus className="h-6 w-6" />
                  <span>Add New Asset</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/assets">
                  <Package className="h-6 w-6" />
                  <span>View All Assets</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/analytics">
                  <BarChart3 className="h-6 w-6" />
                  <span>Analytics</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/qr-management">
                  <QrCode className="h-6 w-6" />
                  <span>QR Management</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 text-sm">All systems operational</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 text-sm">Authentication active</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-700 text-sm">
                {stats?.recentAdditions || 0} assets added recently
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        {(!stats || stats.total === 0) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Welcome to AssetPro!</CardTitle>
              <CardDescription className="text-blue-700">
                Get started by adding your first asset to begin managing your inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-blue-800">Add your first asset using the form above</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-blue-800">Generate QR codes for easy asset identification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="text-blue-800">Track asset locations and assignments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <span className="text-blue-800">Monitor analytics and generate reports</span>
                </div>
                <Button asChild className="mt-4">
                  <Link href="/add-asset">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Asset
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
