"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Bell, X, AlertTriangle, CheckCircle, Info, Zap } from "lucide-react"
import { realtimeAnalytics, type AnalyticsEvent } from "@/lib/realtime-client"

interface Notification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
}

export default function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleAnalyticsEvent = (event: AnalyticsEvent) => {
      // Create notification based on event type
      const notification = createNotificationFromEvent(event)

      if (notification) {
        setNotifications((prev) => [notification, ...prev.slice(0, 9)]) // Keep last 10

        // Show toast for important events
        if (shouldShowToast(event.event_type)) {
          toast({
            title: notification.title,
            description: notification.message,
            duration: 5000,
          })
        }
      }
    }

    realtimeAnalytics.subscribeToAnalytics(handleAnalyticsEvent)

    return () => {
      // Cleanup handled by analytics client
    }
  }, [toast])

  const createNotificationFromEvent = (event: AnalyticsEvent): Notification | null => {
    const baseNotification = {
      id: event.id,
      timestamp: event.timestamp,
      read: false,
    }

    switch (event.event_type) {
      case "asset_created":
        return {
          ...baseNotification,
          type: "success" as const,
          title: "New Asset Added",
          message: `Asset ${event.asset_id} has been successfully created`,
        }
      case "asset_scanned":
        return {
          ...baseNotification,
          type: "info" as const,
          title: "Asset Scanned",
          message: `QR code for asset ${event.asset_id} was scanned`,
        }
      case "qr_generated":
        return {
          ...baseNotification,
          type: "success" as const,
          title: "QR Code Generated",
          message: `QR code created for asset ${event.asset_id}`,
        }
      case "user_login":
        return {
          ...baseNotification,
          type: "info" as const,
          title: "User Login",
          message: "A user has logged into the system",
        }
      default:
        return null
    }
  }

  const shouldShowToast = (eventType: string): boolean => {
    return ["asset_created", "qr_generated"].includes(eventType)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "info":
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center">
                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                Live Notifications
              </h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800 mt-1">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(notification.timestamp).toLocaleString()}</p>
                    </div>
                    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>}
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
