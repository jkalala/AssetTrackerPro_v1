"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { Tenant } from "@/lib/rbac/types"
import { 
  Building2,
  Users,
  Settings,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HexColorPicker } from "react-colorful"

export default function TenantPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    settings: {
      allowMultipleLocations: false,
      requireAssetPhotos: false,
      enableGeofencing: false,
      enableAnalytics: false
    }
  })
  const [branding, setBranding] = useState({
    logoUrl: tenant?.branding_logo_url || "",
    primaryColor: tenant?.branding_primary_color || "#2563eb",
    secondaryColor: tenant?.branding_secondary_color || "#f1f5f9",
    companyName: tenant?.branding_company_name || formData.name || ""
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadTenantInfo()
    }
  }, [user])

  const loadTenantInfo = async () => {
    try {
      const supabase = createClient()
      
      // Get profile with tenant info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, tenants(*)')
        .eq('id', user?.id)
        .single()

      if (profile) {
        setProfile(profile)
        if (profile.tenants) {
          setTenant(profile.tenants)
          setFormData({
            name: profile.tenants.name || "",
            industry: profile.tenants.industry || "",
            website: profile.tenants.website || "",
            contact_email: profile.tenants.contact_email || "",
            contact_phone: profile.tenants.contact_phone || "",
            address: profile.tenants.address || "",
            city: profile.tenants.city || "",
            state: profile.tenants.state || "",
            country: profile.tenants.country || "",
            postal_code: profile.tenants.postal_code || "",
            settings: profile.tenants.settings || {
              allowMultipleLocations: false,
              requireAssetPhotos: false,
              enableGeofencing: false,
              enableAnalytics: false
            }
          })
          setBranding({
            logoUrl: profile.tenants.branding_logo_url || "",
            primaryColor: profile.tenants.branding_primary_color || "#2563eb",
            secondaryColor: profile.tenants.branding_secondary_color || "#f1f5f9",
            companyName: profile.tenants.branding_company_name || profile.tenants.name || ""
          })
        }
      }
    } catch (error) {
      console.error('Error loading tenant info:', error)
      toast({
        title: "Error",
        description: "Failed to load tenant information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSettingChange = (setting: string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: !prev.settings[setting as keyof typeof prev.settings]
      }
    }))
  }

  const handleBrandingChange = (field: string, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenant) return
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from("branding-logos")
      .upload(`${tenant.id}/${file.name}`, file, { upsert: true })
    if (error) {
      toast({ title: "Error", description: "Logo upload failed", variant: "destructive" })
      return
    }
    const url = supabase.storage.from("branding-logos").getPublicUrl(`${tenant.id}/${file.name}`).data.publicUrl
    setBranding(prev => ({ ...prev, logoUrl: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return

    try {
      setSaving(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          branding_logo_url: branding.logoUrl,
          branding_primary_color: branding.primaryColor,
          branding_secondary_color: branding.secondaryColor,
          branding_company_name: branding.companyName,
          metadata: {
            industry: formData.industry,
            website: formData.website,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            postal_code: formData.postal_code,
            settings: formData.settings
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Tenant information updated successfully"
      })

      await loadTenantInfo()
    } catch (error) {
      console.error('Error updating tenant:', error)
      toast({
        title: "Error",
        description: "Failed to update tenant information",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-6 w-6 mr-2" />
              No Tenant Found
            </CardTitle>
            <CardDescription>
              You are not associated with any tenant organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Please contact your administrator to get access to a tenant organization.
            </p>
            <Button variant="outline">Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Tenant Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-6 w-6 mr-2" />
              Tenant Organization
            </CardTitle>
            <CardDescription>
              Manage your organization settings and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Badge variant="outline" className="mb-2">Tenant ID</Badge>
                <p className="font-mono text-sm">{tenant.id}</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Plan</Badge>
                <p className="font-medium capitalize">{tenant.plan}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Branding Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Branding</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="branding_logo">Logo</Label>
                    <div className="flex items-center space-x-4">
                      {branding.logoUrl && (
                        <img src={branding.logoUrl} alt="Logo Preview" className="h-12 w-12 rounded bg-white border" />
                      )}
                      <Button type="button" onClick={() => fileInputRef.current?.click()}>Upload Logo</Button>
                      <input
                        ref={fileInputRef}
                        id="branding_logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="branding_company_name">Company Name</Label>
                    <Input
                      id="branding_company_name"
                      name="branding_company_name"
                      value={branding.companyName}
                      onChange={e => handleBrandingChange("companyName", e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label>Primary Color</Label>
                    <HexColorPicker color={branding.primaryColor} onChange={color => handleBrandingChange("primaryColor", color)} />
                    <Input
                      className="mt-2"
                      value={branding.primaryColor}
                      onChange={e => handleBrandingChange("primaryColor", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Secondary Color</Label>
                    <HexColorPicker color={branding.secondaryColor} onChange={color => handleBrandingChange("secondaryColor", color)} />
                    <Input
                      className="mt-2"
                      value={branding.secondaryColor}
                      onChange={e => handleBrandingChange("secondaryColor", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="Enter industry"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="Enter website URL"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      placeholder="Enter contact email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      placeholder="Enter contact phone"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="Enter state/province"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Enter country"
                      />
                    </div>

                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Feature Settings</h3>
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Multiple Locations</Label>
                      <p className="text-sm text-gray-500">Allow tracking assets across multiple locations</p>
                    </div>
                    <Button
                      type="button"
                      variant={formData.settings.allowMultipleLocations ? "default" : "outline"}
                      onClick={() => handleSettingChange('allowMultipleLocations')}
                    >
                      {formData.settings.allowMultipleLocations ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Asset Photos</Label>
                      <p className="text-sm text-gray-500">Require photos for asset registration</p>
                    </div>
                    <Button
                      type="button"
                      variant={formData.settings.requireAssetPhotos ? "default" : "outline"}
                      onClick={() => handleSettingChange('requireAssetPhotos')}
                    >
                      {formData.settings.requireAssetPhotos ? 'Required' : 'Optional'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Geofencing</Label>
                      <p className="text-sm text-gray-500">Enable geofencing features</p>
                    </div>
                    <Button
                      type="button"
                      variant={formData.settings.enableGeofencing ? "default" : "outline"}
                      onClick={() => handleSettingChange('enableGeofencing')}
                    >
                      {formData.settings.enableGeofencing ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Analytics</Label>
                      <p className="text-sm text-gray-500">Enable advanced analytics</p>
                    </div>
                    <Button
                      type="button"
                      variant={formData.settings.enableAnalytics ? "default" : "outline"}
                      onClick={() => handleSettingChange('enableAnalytics')}
                    >
                      {formData.settings.enableAnalytics ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Delete Organization</h4>
                  <p className="text-sm text-gray-500">
                    Permanently delete this organization and all its data
                  </p>
                </div>
                <Button variant="destructive">
                  Delete Organization
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 