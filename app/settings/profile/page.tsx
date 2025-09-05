'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ProfileSettingsPage() {
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    window.open('/api/gdpr/export-user-data', '_blank')
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account and all associated data? This cannot be undone.'
      )
    )
      return
    setDeleting(true)
    setError(null)
    const res = await fetch('/api/gdpr/delete-user-data', { method: 'POST' })
    if (res.ok) {
      setDeleted(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to delete account')
    }
    setDeleting(false)
  }

  if (deleted) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-xl">
        Your account and data have been deleted.
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-16 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <div className="space-y-4">
        <Button onClick={handleExport} variant="outline">
          Export My Data (GDPR)
        </Button>
        <Button onClick={handleDelete} variant="destructive" disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete My Account (GDPR)'}
        </Button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
    </div>
  )
}
