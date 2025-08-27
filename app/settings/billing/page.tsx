"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { createCheckoutSession, cancelSubscription } from "@/lib/billing/stripe"
import { Tenant } from "@/lib/rbac/types"
import { 
  CreditCard, 
  Package, 
  Check, 
  X, 
  AlertTriangle,
  Building2,
  Users,
  QrCode,
  BarChart3,
  Code2,
  Paintbrush,
  MapPin,
  FileText,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlanFeature {
  name: string
  free: boolean
  basic: boolean
  pro: boolean
  enterprise: boolean
  icon: React.ElementType
}

const planFeatures: PlanFeature[] = [
  {
    name: "QR Code Generation",
    free: true,
    basic: true,
    pro: true,
    enterprise: true,
    icon: QrCode
  },
  {
    name: "Analytics",
    free: false,
    basic: true,
    pro: true,
    enterprise: true,
    icon: BarChart3
  },
  {
    name: "API Access",
    free: false,
    basic: false,
    pro: true,
    enterprise: true,
    icon: Code2
  },
  {
    name: "Custom Branding",
    free: false,
    basic: false,
    pro: true,
    enterprise: true,
    icon: Paintbrush
  },
  {
    name: "Multiple Locations",
    free: false,
    basic: false,
    pro: true,
    enterprise: true,
    icon: MapPin
  },
  {
    name: "Advanced Reports",
    free: false,
    basic: false,
    pro: false,
    enterprise: true,
    icon: FileText
  }
]

const planPrices = {
  free: 0,
  basic: 29,
  pro: 99,
  enterprise: 299
}

export default function BillingPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [billing, setBilling] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadBillingInfo()
    }
  }, [user])

  const loadBillingInfo = async () => {
    try {
      const supabase = createClient()
      
      // Get tenant info
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

      if (!profile?.tenant_id) return

      // Get tenant and billing details
      const [tenantResult, billingResult] = await Promise.all([
        supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .single(),
        supabase
          .from('billing')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .single()
      ])

      if (tenantResult.data) setTenant(tenantResult.data as Tenant)
      if (billingResult.data) setBilling(billingResult.data)
    } catch (error) {
      console.error('Error loading billing info:', error)
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: string) => {
    if (!tenant || !billing) return

    try {
      setUpgrading(true)
      const checkoutUrl = await createCheckoutSession(
        billing.stripe_customer_id,
        plan,
        tenant.id
      )
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast({
        title: "Error",
        description: "Failed to start upgrade process",
        variant: "destructive"
      })
    } finally {
      setUpgrading(false)
    }
  }

  const handleCancel = async () => {
    if (!tenant || !billing?.stripe_subscription_id) return

    try {
      setCancelling(true)
      await cancelSubscription(billing.stripe_subscription_id)
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the end of the current billing period",
      })

      await loadBillingInfo()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      })
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Current Plan Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-6 w-6 mr-2" />
              Current Plan
            </CardTitle>
            <CardDescription>
              Your current subscription and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-lg mb-2">
                  {tenant?.plan ? tenant?.plan.charAt(0).toUpperCase() + tenant?.plan.slice(1) : 'Free'} Plan
                </h3>
                <p className="text-3xl font-bold">
                  ${planPrices[tenant?.plan as keyof typeof planPrices]}/mo
                </p>
                {billing?.cancel_at_period_end && (
                  <Badge variant="destructive" className="mt-2">
                    Cancels at period end
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Users</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{billing?.active_users || 0} active users</span>
                    <span>{tenant?.maxUsers} max</span>
                  </div>
                  <Progress 
                    value={((billing?.active_users || 0) / (tenant?.maxUsers || 1)) * 100} 
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Assets</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{billing?.total_assets || 0} assets</span>
                    <span>{tenant?.maxAssets} max</span>
                  </div>
                  <Progress 
                    value={((billing?.total_assets || 0) / (tenant?.maxAssets || 1)) * 100} 
                  />
                </div>
              </div>
            </div>

            {tenant?.plan !== 'enterprise' && (
              <div className="mt-6 flex items-center justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={cancelling || tenant?.plan === 'free'}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
                <Button
                  onClick={() => handleUpgrade('pro')}
                  disabled={upgrading}
                >
                  {upgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    "Upgrade Plan"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>For small teams just getting started</CardDescription>
              <p className="text-3xl font-bold mt-2">$0/mo</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                  <span>1 Location</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Up to 5 users</span>
                </li>
                <li className="flex items-start">
                  <Package className="h-5 w-5 mr-2 text-gray-400" />
                  <span>100 assets</span>
                </li>
                {planFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.free ? (
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 mr-2 text-red-500" />
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-6"
                variant="outline"
                disabled={tenant?.plan === 'free'}
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Basic Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Basic</CardTitle>
              <CardDescription>For growing businesses</CardDescription>
              <p className="text-3xl font-bold mt-2">$29/mo</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                  <span>3 Locations</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Up to 10 users</span>
                </li>
                <li className="flex items-start">
                  <Package className="h-5 w-5 mr-2 text-gray-400" />
                  <span>500 assets</span>
                </li>
                {planFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.basic ? (
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 mr-2 text-red-500" />
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-6"
                onClick={() => handleUpgrade('basic')}
                disabled={tenant?.plan === 'basic' || upgrading}
              >
                {tenant?.plan === 'basic' ? 'Current Plan' : 'Upgrade to Basic'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <Badge className="w-fit mb-2">Most Popular</Badge>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For professional teams</CardDescription>
              <p className="text-3xl font-bold mt-2">$99/mo</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Unlimited Locations</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Up to 50 users</span>
                </li>
                <li className="flex items-start">
                  <Package className="h-5 w-5 mr-2 text-gray-400" />
                  <span>5,000 assets</span>
                </li>
                {planFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.pro ? (
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 mr-2 text-red-500" />
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-6"
                onClick={() => handleUpgrade('pro')}
                disabled={tenant?.plan === 'pro' || upgrading}
              >
                {tenant?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>For large organizations</CardDescription>
              <p className="text-3xl font-bold mt-2">$299/mo</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Unlimited Locations</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Unlimited users</span>
                </li>
                <li className="flex items-start">
                  <Package className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Unlimited assets</span>
                </li>
                {planFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.enterprise ? (
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 mr-2 text-red-500" />
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-6"
                onClick={() => handleUpgrade('enterprise')}
                disabled={tenant?.plan === 'enterprise' || upgrading}
              >
                {tenant?.plan === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-6 w-6 mr-2" />
              Billing History
            </CardTitle>
            <CardDescription>
              Recent invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billing?.billing_history?.length > 0 ? (
              <div className="divide-y">
                {billing.billing_history.map((item: any) => (
                  <div key={item.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{new Date(item.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">Invoice #{item.invoice_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.amount}</p>
                      <Badge variant={(item as any).status === 'paid' ? 'default' : 'destructive'}>
                        {(item as any).status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No billing history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Need Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-gray-600">
              Contact our support team for any billing related questions
            </p>
            <Button variant="outline">Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 