"use client"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTenant } from "@/components/providers/tenant-provider"

export function SessionSync() {
  const { tenantContext } = useTenant()

  useEffect(() => {
    const syncSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        })
      }
    }
    syncSession()
  }, [])

  // Sync tenant context when it changes
  useEffect(() => {
    const syncTenantContext = async () => {
      if (tenantContext) {
        try {
          // Set tenant context in the database session
          await fetch('/api/auth/set-tenant-context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              tenantId: tenantContext.tenantId,
              userId: tenantContext.userId,
              role: tenantContext.role
            }),
          })
        } catch (error) {
          console.error('Failed to sync tenant context:', error)
        }
      }
    }
    
    syncTenantContext()
  }, [tenantContext])

  return null
} 