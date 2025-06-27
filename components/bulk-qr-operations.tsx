"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QrCode, Download, Upload, CheckCircle, AlertTriangle, FileText } from "lucide-react"
import { generateBulkQRCodes } from "@/lib/qr-actions"

interface Asset {
  id: string
  asset_id: string
  name: string
  category: string
  status: string
  qr_code?: string | null
}

interface BulkQROperationsProps {
  assets: Asset[]
  onBulkGenerated?: (results: any[]) => void
}

export default function BulkQROperations({ assets, onBulkGenerated }: BulkQROperationsProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const assetsWithoutQR = assets.filter((asset) => !asset.qr_code)
  const allSelected = selectedAssets.length === assetsWithoutQR.length
  const someSelected = selectedAssets.length > 0

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedAssets([])
    } else {
      setSelectedAssets(assetsWithoutQR.map((asset) => asset.asset_id))
    }
  }

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssets((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]))
  }

  const handleBulkGenerate = async () => {
    if (selectedAssets.length === 0) {
      setError("Please select at least one asset")
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)
    setResults([])

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await generateBulkQRCodes(selectedAssets)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.error) {
        setError(result.error)
      } else {
        setResults(result.results!)
        if (onBulkGenerated) {
          onBulkGenerated(result.results!)
        }
      }
    } catch (err) {
      setError("Failed to generate QR codes")
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const handleDownloadAll = () => {
    const successfulResults = results.filter((r) => r.success)

    successfulResults.forEach((result, index) => {
      setTimeout(() => {
        const link = document.createElement("a")
        link.download = `qr-${result.assetId}.png`
        link.href = result.qrCode
        link.click()
      }, index * 100) // Stagger downloads
    })
  }

  const generateCSVTemplate = () => {
    const csvContent = [
      "asset_id,name,category,location,value",
      'AST-001,MacBook Pro 16",it-equipment,Office A,2499.99',
      "AST-002,Office Chair,furniture,Office B,299.99",
      "AST-003,Projector,av-equipment,Conference Room,899.99",
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "asset-template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Bulk QR Code Operations
          </CardTitle>
          <CardDescription>Generate QR codes for multiple assets at once</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating QR codes...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {results.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>Generated {results.filter((r) => r.success).length} QR codes successfully</span>
                  <Button size="sm" onClick={handleDownloadAll}>
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Asset Selection */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Select Assets ({selectedAssets.length} of {assetsWithoutQR.length} selected)
                </h4>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={assetsWithoutQR.length === 0}>
                    {allSelected ? "Deselect All" : "Select All"}
                  </Button>
                  <Button onClick={handleBulkGenerate} disabled={!someSelected || loading} size="sm">
                    Generate QR Codes
                  </Button>
                </div>
              </div>

              {assetsWithoutQR.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>All assets already have QR codes generated!</AlertDescription>
                </Alert>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                          </TableHead>
                          <TableHead>Asset ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assetsWithoutQR.map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAssets.includes(asset.asset_id)}
                                onCheckedChange={() => handleSelectAsset(asset.asset_id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{asset.asset_id}</TableCell>
                            <TableCell>{asset.name}</TableCell>
                            <TableCell className="capitalize">{asset.category}</TableCell>
                            <TableCell className="capitalize">{asset.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tools and Templates */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import Tools</CardTitle>
                  <CardDescription>Bulk import assets from CSV</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full" onClick={generateCSVTemplate}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>

                  <Button variant="outline" className="w-full" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV File
                  </Button>

                  <p className="text-xs text-gray-500">
                    Upload a CSV file with asset data to bulk create assets and generate QR codes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">QR Code Settings</CardTitle>
                  <CardDescription>Default settings for bulk generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size</label>
                    <select className="w-full px-3 py-2 border rounded-md text-sm">
                      <option value="200">200x200 px</option>
                      <option value="300">300x300 px</option>
                      <option value="400">400x400 px</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Format</label>
                    <select className="w-full px-3 py-2 border rounded-md text-sm">
                      <option value="png">PNG</option>
                      <option value="svg">SVG</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Results Display */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.assetId}>
                        <TableCell className="font-medium">{result.assetId}</TableCell>
                        <TableCell>
                          {result.success ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Success
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Failed
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.success && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement("a")
                                link.download = `qr-${result.assetId}.png`
                                link.href = result.qrCode
                                link.click()
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
