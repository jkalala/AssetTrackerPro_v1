import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Trash, FileText, Loader2, Upload, Eye } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface Attachment {
  id: string
  file_url: string
  file_name: string
  type: string
  size: number
  uploaded_by: string
  uploaded_at: string
  description?: string
}

interface AssetAttachmentsProps {
  assetId: string
  userRole: string
}

const isImage = (type: string) => type.startsWith('image/')
const isPdf = (type: string) => type === 'application/pdf'
const isOfficeDoc = (type: string) => [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].includes(type)
const allowedTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function formatSize(size: number) {
  if (size > 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB'
  return (size / 1024).toFixed(1) + ' KB'
}

export default function AssetAttachments({ assetId, userRole }: AssetAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<Attachment | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAttachments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/assets/${assetId}/attachments`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else setAttachments(data.attachments || [])
    } catch (err) {
      setError('Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttachments()
    // eslint-disable-next-line
  }, [assetId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSuccess(null)
    // Validate type
    if (!allowedTypes.includes(file.type)) {
      setError('File type not allowed. Only images, PDFs, and office docs are supported.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    // Validate size
    if (file.size > MAX_SIZE) {
      setError('File is too large. Max size is 10MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('description', description)
      const res = await fetch(`/api/assets/${assetId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else {
        setSuccess('File uploaded successfully')
        setDescription('')
        fetchAttachments()
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this attachment?')) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/assets/${assetId}/attachments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else {
        setSuccess('Attachment deleted')
        fetchAttachments()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 mr-2" />
          Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <form className="flex flex-col sm:flex-row items-center gap-2" onSubmit={e => e.preventDefault()}>
          <Input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileChange}
            disabled={uploading}
            className="max-w-xs"
          />
          <Input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={uploading}
            className="max-w-xs"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            type="button"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </form>
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading attachments...
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-gray-500">No attachments yet.</div>
          ) : (
            attachments.map(att => (
              <div key={att.id} className="flex items-center gap-4 border rounded p-2 bg-gray-50 flex-wrap">
                {isImage(att.type) ? (
                  <button type="button" onClick={() => setPreview(att)} className="focus:outline-none">
                    <img src={att.file_url} alt={att.file_name} className="w-16 h-16 object-cover rounded border" />
                  </button>
                ) : isPdf(att.type) ? (
                  <button type="button" onClick={() => setPreview(att)} className="focus:outline-none">
                    <FileText className="h-10 w-10 text-red-600" />
                  </button>
                ) : (
                  <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-10 w-10 text-gray-600" />
                  </a>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{att.file_name}</div>
                  <div className="text-xs text-gray-500">{formatSize(att.size)}</div>
                  <div className="text-xs text-gray-400">{new Date(att.uploaded_at).toLocaleString()}</div>
                  {att.description && <div className="text-xs text-gray-700 italic mt-1">{att.description}</div>}
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={att.file_url} download target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
                {['admin', 'manager'].includes(userRole) && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(att.id)}
                    title="Delete"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
                {(isImage(att.type) || isPdf(att.type)) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreview(att)}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        {/* Preview Modal */}
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-lg w-full p-0 bg-white">
            {preview && isImage(preview.type) && (
              <img src={preview.file_url} alt={preview.file_name} className="w-full h-auto object-contain rounded" />
            )}
            {preview && isPdf(preview.type) && (
              <iframe
                src={preview.file_url}
                title={preview.file_name}
                className="w-full h-[70vh] rounded"
                frameBorder={0}
              />
            )}
            {preview && !isImage(preview.type) && !isPdf(preview.type) && (
              <div className="p-6 text-center">No preview available for this file type.</div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 