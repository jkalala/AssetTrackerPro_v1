"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Package, Loader2, AlertTriangle, Settings, Save, ArrowLeft, Sparkles } from "lucide-react"
import { addAsset, generateAssetId } from "@/lib/asset-actions"
import { useAuth } from "@/components/auth/auth-provider"
import { checkUserProfile } from "@/lib/profile-actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AddAssetForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [profileStatus, setProfileStatus] = useState<"loading" | "exists" | "missing">("loading")
  const [generatingId, setGeneratingId] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    asset_id: "",
    name: "",
    description: "",
    category: "",
    status: "active" as const,
    location: "",
    purchase_value: "",
    purchase_date: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    warranty_expiry: "",
    assigned_to: "",
    tags: "",
    notes: "",
  })

  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([])
  const [customFields, setCustomFields] = useState<{ [fieldId: string]: string }>({})
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function checkProfile() {
      if (!user) return

      try {
        setProfileStatus("loading")
        const result = await checkUserProfile()

        if (result.error) {
          console.error("Profile check error:", result.error)
          setProfileStatus("exists")
          return
        }

        if (result.exists) {
          console.log("Profile exists:", result.profile)
          setProfileStatus("exists")
        } else {
          console.log("Profile missing, user:", result.user)
          setProfileStatus("missing")
        }
      } catch (err) {
        console.error("Profile check failed:", err)
        setProfileStatus("exists")
      }
    }

    checkProfile()
  }, [user])

  useEffect(() => {
    async function fetchCustomFields() {
      const res = await fetch("/api/custom-fields")
      const json = await res.json()
      setCustomFieldDefs(json.data || [])
    }
    fetchCustomFields()
  }, [])

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/categories")
      const json = await res.json()
      setCategories(json.data || [])
    }
    fetchCategories()
  }, [])

  // Helper to build category options (flat with indentation for subcategories)
  const buildCategoryOptions = (list: any[], parentId: string | null = null, level = 0): any[] =>
    list.filter(c => (c.parent_id || "") === (parentId || "")).flatMap(c => [
      { ...c, indent: level },
      ...buildCategoryOptions(list, c.id, level + 1)
    ])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleGenerateAssetId = async () => {
    setGeneratingId(true)
    try {
      const newId = await generateAssetId(formData.category)
      setFormData(prev => ({ ...prev, asset_id: newId }))
      toast({
        title: "Asset ID Generated",
        description: "A unique asset ID has been generated for you."
      })
    } catch (error) {
      toast({
        title: "Error Generating ID",
        description: "Failed to generate asset ID. Please try again.",
        variant: "destructive"
      })
    } finally {
      setGeneratingId(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate custom fields
    for (const field of customFieldDefs) {
      const value = customFields[field.id] ?? ""
      if (field.required && !value) {
        setError(`Custom field "${field.label}" is required.`)
        setLoading(false)
        return
      }
      if (field.validation) {
        try {
          const rules = typeof field.validation === "string" ? JSON.parse(field.validation) : field.validation
          if (field.type === "text" || field.type === "dropdown") {
            if (rules.min !== undefined && value.length < rules.min) {
              setError(`Custom field "${field.label}" must be at least ${rules.min} characters.`)
              setLoading(false)
              return
            }
            if (rules.max !== undefined && value.length > rules.max) {
              setError(`Custom field "${field.label}" must be at most ${rules.max} characters.`)
              setLoading(false)
              return
            }
          } else if (field.type === "number") {
            const num = Number(value)
            if (isNaN(num)) {
              setError(`Custom field "${field.label}" must be a number.`)
              setLoading(false)
              return
            }
            if (rules.min !== undefined && num < rules.min) {
              setError(`Custom field "${field.label}" must be at least ${rules.min}.`)
              setLoading(false)
              return
            }
            if (rules.max !== undefined && num > rules.max) {
              setError(`Custom field "${field.label}" must be at most ${rules.max}.`)
              setLoading(false)
              return
            }
          }
          // Add more type-specific validation as needed
        } catch {}
      }
    }

    try {
      const result = await addAsset({
        asset_id: formData.asset_id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        status: formData.status,
        location: formData.location || null,
        purchase_value: formData.purchase_value ? Number.parseFloat(formData.purchase_value) : null,
        purchase_date: formData.purchase_date || null,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        warranty_expiry: formData.warranty_expiry || null,
        assigned_to: formData.assigned_to || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        notes: formData.notes || null,
      })

      if (result.error) {
        setError(result.error)
        toast({
          title: "Error Adding Asset",
          description: result.error,
          variant: "destructive"
        })
      } else {
        // Save custom field values
        if (Object.keys(customFields).length > 0) {
          await fetch(`/api/assets/${result.data.id}/custom-fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ values: Object.entries(customFields).map(([field_id, value]) => ({ field_id, value })) })
          })
        }
        setSuccess(true)
        toast({
          title: "Asset Added Successfully",
          description: "Your asset has been added to the inventory."
        })
        
        // Reset form
        setFormData({
          asset_id: "",
          name: "",
          description: "",
          category: "",
          status: "active",
          location: "",
          purchase_value: "",
          purchase_date: "",
          manufacturer: "",
          model: "",
          serial_number: "",
          warranty_expiry: "",
          assigned_to: "",
          tags: "",
          notes: "",
        })
        setCustomFields({})
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/assets")
        }, 1500)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      toast({
        title: "Error Adding Asset",
        description: "An unexpected error occurred while adding the asset.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (profileStatus === "loading") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Setting up your profile...
          </CardTitle>
          <CardDescription>Please wait while we prepare the form</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Setup Component - only show if profile is missing */}
      {profileStatus === "missing" && (
        <Card className="w-full max-w-2xl mx-auto border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Profile Setup Required</CardTitle>
            <CardDescription className="text-orange-700">
              Please complete your profile setup before adding assets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/profile-setup">
                <Settings className="h-4 w-4 mr-2" />
                Complete Profile Setup
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Add New Asset
              </CardTitle>
              <CardDescription>Enter comprehensive details for your new asset</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/assets">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assets
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
                {error.includes("foreign key constraint") && (
                  <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-sm font-medium text-red-800 mb-2">Profile Issue Detected</p>
                    <p className="text-sm text-red-700 mb-3">
                      This error occurs when your user profile is missing from the database.
                    </p>
                    <div className="space-y-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/profile-setup">
                          <Settings className="h-4 w-4 mr-2" />
                          Go to Profile Setup
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ Asset added successfully! Redirecting to assets page...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="details">Asset Details</TabsTrigger>
                <TabsTrigger value="financial">Financial & Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset_id">Asset ID *</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="asset_id"
                        value={formData.asset_id}
                        onChange={(e) => handleInputChange("asset_id", e.target.value)}
                        placeholder="e.g., IT-123456-01"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateAssetId}
                        disabled={generatingId}
                      >
                        {generatingId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Asset Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., MacBook Pro 16-inch"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Detailed description of the asset..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildCategoryOptions(categories).map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {"\u00A0".repeat(cat.indent * 4)}{cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., Office A, Warehouse B, Conference Room"
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                      placeholder="e.g., Apple, Dell, HP"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange("model", e.target.value)}
                      placeholder="e.g., MacBook Pro 16-inch, Latitude 5520"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => handleInputChange("serial_number", e.target.value)}
                    placeholder="e.g., C02XYZ123456"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                    <Input
                      id="warranty_expiry"
                      type="date"
                      value={formData.warranty_expiry}
                      onChange={(e) => handleInputChange("warranty_expiry", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    placeholder="e.g., laptop, development, high-value (comma separated)"
                  />
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_value">Purchase Value</Label>
                    <Input
                      id="purchase_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchase_value}
                      onChange={(e) => handleInputChange("purchase_value", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assigned To</Label>
                    <Input
                      id="assigned_to"
                      value={formData.assigned_to}
                      onChange={(e) => handleInputChange("assigned_to", e.target.value)}
                      placeholder="e.g., john.doe@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes, maintenance history, or special instructions..."
                    rows={4}
                  />
                </div>
                {/* --- Custom Fields Section --- */}
                {customFieldDefs.length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold mb-2">Custom Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customFieldDefs.map(field => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={`custom-${field.id}`}>{field.label}{field.required && " *"}</Label>
                          {field.type === "text" && (
                            <Input
                              id={`custom-${field.id}`}
                              value={customFields[field.id] || ""}
                              onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                              required={field.required}
                            />
                          )}
                          {field.type === "number" && (
                            <Input
                              id={`custom-${field.id}`}
                              type="number"
                              value={customFields[field.id] || ""}
                              onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                              required={field.required}
                            />
                          )}
                          {field.type === "date" && (
                            <Input
                              id={`custom-${field.id}`}
                              type="date"
                              value={customFields[field.id] || ""}
                              onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                              required={field.required}
                            />
                          )}
                          {field.type === "dropdown" && Array.isArray(field.options) && (
                            <Select
                              value={customFields[field.id] || ""}
                              onValueChange={val => handleCustomFieldChange(field.id, val)}
                              required={field.required}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((opt: string) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* --- End Custom Fields Section --- */}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/assets")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || profileStatus === "missing"}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Add Asset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
