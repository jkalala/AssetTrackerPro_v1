import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Image as ImageIcon, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface QRImageUploadProps {
  onUploadComplete: (assetId: string, imageUrl: string) => void
}

export default function QRImageUpload({ onUploadComplete }: QRImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.includes("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const supabase = createClient()
      
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `qr-codes/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath)

      toast({
        title: "Upload Successful",
        description: "QR code image has been uploaded",
      })

      onUploadComplete("custom", publicUrl)
      
      // Reset state
      setSelectedFile(null)
      setPreview(null)
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload QR code image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ImageIcon className="h-5 w-5 mr-2" />
          Upload QR Code Image
        </CardTitle>
        <CardDescription>Upload an existing QR code image for an asset</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          {preview ? (
            <div className="space-y-4">
              <img src={preview} alt="Preview" className="max-w-[200px] mx-auto" />
              <Button variant="outline" onClick={() => {
                setSelectedFile(null)
                setPreview(null)
              }}>
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    Select QR Code Image
                  </label>
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Supports: PNG, JPG, JPEG, GIF (max 5MB)
              </p>
            </div>
          )}
        </div>

        {selectedFile && (
          <Button 
            className="w-full" 
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload QR Code"}
          </Button>
        )}

        <div className="flex items-start space-x-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <p>
            Make sure the QR code image is clear and readable. Poor quality images may not scan properly.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 