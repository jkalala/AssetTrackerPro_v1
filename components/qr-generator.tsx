"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, Download, Copy, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { generateAssetQRCode } from "@/lib/qr-actions"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { updateAssetQRCodeUrl } from "@/lib/qr-actions"

interface QRGeneratorProps {
  assets?: Array<{
    id: string
    asset_id: string
    name: string
    category: string
  }>
  onQRGenerated?: (assetId: string, qrCode: string) => void
}

export default function QRGenerator({ assets = [], onQRGenerated }: QRGeneratorProps) {
  const { user, loading: authLoading } = useAuth()
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [customAssetId, setCustomAssetId] = useState("")
  const [qrSize, setQrSize] = useState("200")
  const [qrColor, setQrColor] = useState("#000000")
  const [qrBgColor, setQrBgColor] = useState("#FFFFFF")
  const [generatedQR, setGeneratedQR] = useState<string | null>(null)
  const [assetUrl, setAssetUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    const assetId = selectedAssetId || customAssetId
    if (!assetId) {
      setError("Please select or enter an Asset ID")
      return
    }

    if (!user) {
      setError("You must be logged in to generate QR codes. Please sign in and try again.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Generate QR code (data URL)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cloudeleavepro.vercel.app"
      const assetUrl = `${baseUrl}/asset/${assetId}`
      const qrCodeDataURL = await import("@/lib/qr-code-utils").then(m => m.QRCodeGenerator.generateAssetQR({
        assetId,
        name: selectedAsset?.name || assetId,
        category: selectedAsset?.category || "",
        url: assetUrl,
      }))

      // 2. Upload to Supabase Storage
      const supabase = createClient()
      const res = await fetch(qrCodeDataURL)
      const blob = await res.blob()
      const filePath = `qr-codes/${assetId}-${Date.now()}.png`
      const { data, error: uploadError } = await supabase.storage
        .from("qr-codes")
        .upload(filePath, blob, { contentType: "image/png", upsert: true })
      if (uploadError) {
        setError("Failed to upload QR code: " + uploadError.message)
        setLoading(false)
        return
      }
      const { data: publicUrlData } = supabase.storage.from("qr-codes").getPublicUrl(filePath)
      const qrCodePublicUrl = publicUrlData.publicUrl

      // 3. Update asset with QR code public URL
      const updateResult = await updateAssetQRCodeUrl(assetId, qrCodePublicUrl)
      if (updateResult.error) {
        setError(updateResult.error)
        setLoading(false)
        return
      }

      setGeneratedQR(qrCodePublicUrl)
      setAssetUrl(assetUrl)
      if (onQRGenerated) {
        onQRGenerated(assetId, qrCodePublicUrl)
      }
    } catch (err) {
      console.error("QR Generator: Generation failed:", err)
      setError(`Failed to generate QR code: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!generatedQR) return

    const link = document.createElement("a")
    link.download = `qr-${selectedAssetId || customAssetId}.png`
    link.href = generatedQR
    link.click()
  }

  const handleCopyUrl = async () => {
    if (!assetUrl) return

    try {
      await navigator.clipboard.writeText(assetUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const selectedAsset = assets.find((asset) => asset.asset_id === selectedAssetId)

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading authentication...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            QR Code Generator
          </CardTitle>
          <CardDescription>Generate QR codes for your assets</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to generate QR codes. Please{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                sign in
              </a>{" "}
              to continue.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            QR Code Generator
          </CardTitle>
          <CardDescription>Generate QR codes for your assets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Asset</Label>
                <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an existing asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.length > 0 ? (
                      assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.asset_id}>
                          {asset.asset_id} - {asset.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No assets found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-center text-sm text-gray-500">or</div>

              <div className="space-y-2">
                <Label htmlFor="customAssetId">Enter Asset ID</Label>
                <Input
                  id="customAssetId"
                  placeholder="e.g., AST-001"
                  value={customAssetId}
                  onChange={(e) => setCustomAssetId(e.target.value)}
                  disabled={!!selectedAssetId}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qrSize">Size (px)</Label>
                  <Select value={qrSize} onValueChange={setQrSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="150">150x150</SelectItem>
                      <SelectItem value="200">200x200</SelectItem>
                      <SelectItem value="300">300x300</SelectItem>
                      <SelectItem value="400">400x400</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrColor">QR Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="qrColor"
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="w-16 h-10 p-1"
                      title="Background Color"
                    />
                  </div>
                </div>
              </div>

              {selectedAsset && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="font-medium text-blue-800 mb-2">Selected Asset</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        <strong>ID:</strong> {selectedAsset.asset_id}
                      </div>
                      <div>
                        <strong>Name:</strong> {selectedAsset.name}
                      </div>
                      <div>
                        <strong>Category:</strong> {selectedAsset.category}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleGenerate}
                className="w-full"
                disabled={loading || (!selectedAssetId && !customAssetId)}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate QR Code"
                )}
              </Button>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
                {generatedQR ? (
                  <div className="space-y-4">
                    <img
                      src={generatedQR || "/placeholder.svg"}
                      alt="Generated QR Code"
                      className="mx-auto border rounded"
                      style={{
                        width: `${qrSize}px`,
                        height: `${qrSize}px`,
                        maxWidth: "100%",
                      }}
                    />
                    <div className="space-y-2">
                      <Button onClick={handleDownload} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Code
                      </Button>

                      {assetUrl && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600">Asset URL:</div>
                          <div className="flex items-center space-x-2">
                            <Input value={assetUrl} readOnly className="text-xs" />
                            <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                              {copied ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">QR code will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
