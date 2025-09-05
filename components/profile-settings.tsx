'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogOut, Upload, User, Mail, Building2, Loader2 } from 'lucide-react'
import SignOutButton from '@/components/auth/sign-out-button'

export default function ProfileSettings() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('id', user.id)
      .single()
    if (error) {
      setError('Failed to load profile.')
    } else {
      setProfile(data)
      setFullName(data.full_name || '')
      setAvatarUrl(data.avatar_url || '')
    }
    setLoading(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    // Optionally preview
    const reader = new FileReader()
    reader.onload = ev => {
      if (ev.target?.result) setAvatarUrl(ev.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (file: File) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${user.id}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
    if (uploadError) {
      setError('Failed to upload avatar.')
      return null
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    let newAvatarUrl = avatarUrl
    if (avatarFile) {
      const url = await uploadAvatar(avatarFile)
      if (url) newAvatarUrl = url
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated.')
      setSaving(false)
      return
    }
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: newAvatarUrl,
      })
      .eq('id', user.id)
    if (updateError) {
      setError('Failed to update profile.')
    } else {
      setSuccess('Profile updated successfully.')
      setAvatarFile(null)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
          <CardDescription>Manage your personal information and avatar</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 bg-gray-100">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                ) : (
                  <User className="w-full h-full text-gray-400" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full p-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={profile?.email || ''}
                readOnly
                className="mt-1 bg-gray-100"
              />
            </div>
            <div>
              <Label>Organization</Label>
              <Input
                type="text"
                value={profile?.tenant_id || ''}
                readOnly
                className="mt-1 bg-gray-100"
              />
            </div>
            {/* Password change could be added here */}
            <div className="flex justify-between items-center pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
              <SignOutButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
