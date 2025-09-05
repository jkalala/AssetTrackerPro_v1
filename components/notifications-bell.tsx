'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [marking, setMarking] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
    // Optionally, set up polling or Supabase Realtime here
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    setNotifications(data || [])
    setLoading(false)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = async () => {
    setMarking(true)
    await supabase.from('notifications').update({ read: true }).eq('read', false)
    await fetchNotifications()
    setMarking(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 border">
          <div className="p-4 border-b flex items-center justify-between">
            <span className="font-semibold">Notifications</span>
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              disabled={marking || unreadCount === 0}
            >
              {marking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Mark all as read
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-4 border-b last:border-b-0 ${n.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{n.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    {n.link && (
                      <Link href={n.link} className="text-blue-600 hover:underline text-xs ml-2">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
