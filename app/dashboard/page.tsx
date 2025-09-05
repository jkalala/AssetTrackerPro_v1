'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Force dynamic rendering and disable SSR completely
export const runtime = 'edge'

// Dynamically import the dashboard component with no SSR
const DashboardContent = dynamic(() => import('@/components/dashboard-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  ),
})

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      checkProfile()
    }
  }, [user, loading, router, mounted])

  const checkProfile = async () => {
    try {
      const supabase = createClient()
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No profile found, redirect to profile setup
        router.push('/profile-setup')
        return
      }

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error checking profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
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

  return <DashboardContent />
}
