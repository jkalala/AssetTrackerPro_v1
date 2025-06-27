"use client"

import { useState, useEffect, useCallback } from "react"
import { realtimeAnalytics, type RealtimeEvent, type AnalyticsEvent } from "@/lib/realtime-client"

export interface RealtimeMetrics {
  totalAssets: number
  activeAssets: number
  assetsCreatedToday: number
  totalUsers: number
  scansThisWeek: number
  recentScans: any[]
  lastUpdated: string
}

export interface ActivityFeed {
  id: string
  type: "asset_created" | "asset_updated" | "asset_scanned" | "user_login" | "qr_generated"
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    totalAssets: 0,
    activeAssets: 0,
    assetsCreatedToday: 0,
    totalUsers: 0,
    scansThisWeek: 0,
    recentScans: [],
    lastUpdated: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const updateMetrics = useCallback(async () => {
    try {
      const newMetrics = await realtimeAnalytics.getRealtimeMetrics()
      setMetrics({
        ...newMetrics,
        lastUpdated: new Date().toISOString(),
      })
      setError(null)
    } catch (err) {
      setError("Failed to update metrics")
      console.error("Metrics update error:", err)
    }
  }, [])

  useEffect(() => {
    // Initial load
    updateMetrics().finally(() => setLoading(false))

    // Subscribe to real-time updates
    const handleAssetChange = (event: RealtimeEvent) => {
      if (event.table === "assets") {
        updateMetrics()
      }
    }

    const handleAnalyticsEvent = (event: AnalyticsEvent) => {
      updateMetrics()
    }

    const assetChannelId = realtimeAnalytics.subscribeToTable("assets", handleAssetChange)
    realtimeAnalytics.subscribeToAnalytics(handleAnalyticsEvent)

    // Cleanup on unmount
    return () => {
      realtimeAnalytics.unsubscribe(assetChannelId, handleAssetChange)
    }
  }, [updateMetrics])

  return { metrics, loading, error, refresh: updateMetrics }
}

export function useActivityFeed(limit = 20) {
  const [activities, setActivities] = useState<ActivityFeed[]>([])
  const [loading, setLoading] = useState(true)

  const addActivity = useCallback(
    (event: AnalyticsEvent) => {
      const activity: ActivityFeed = {
        id: event.id,
        type: event.event_type,
        title: getActivityTitle(event.event_type),
        description: getActivityDescription(event),
        timestamp: event.timestamp,
        metadata: event.metadata,
      }

      setActivities((prev) => [activity, ...prev.slice(0, limit - 1)])
    },
    [limit],
  )

  useEffect(() => {
    // Subscribe to analytics events
    realtimeAnalytics.subscribeToAnalytics(addActivity)

    // Load initial activities (mock data for demo)
    const mockActivities: ActivityFeed[] = [
      {
        id: "1",
        type: "asset_created",
        title: "New Asset Created",
        description: 'MacBook Pro 16" was added to inventory',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        type: "asset_scanned",
        title: "Asset Scanned",
        description: "Office Chair QR code was scanned",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        type: "qr_generated",
        title: "QR Code Generated",
        description: "QR code created for Projector",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ]

    setActivities(mockActivities)
    setLoading(false)

    return () => {
      // Cleanup handled by the analytics client
    }
  }, [addActivity])

  return { activities, loading }
}

export function useRealtimeAssetStatus(assetId?: string) {
  const [assetStatus, setAssetStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!assetId) {
      setLoading(false)
      return
    }

    const handleAssetUpdate = (event: RealtimeEvent) => {
      if (event.type === "UPDATE" && event.record) {
        setAssetStatus(event.record)
      }
    }

    const channelId = realtimeAnalytics.subscribeToTable("assets", handleAssetUpdate, {
      column: "asset_id",
      value: assetId,
    })

    // Load initial status
    realtimeAnalytics.supabase
      .from("assets")
      .select("*")
      .eq("asset_id", assetId)
      .single()
      .then(({ data }) => {
        setAssetStatus(data)
        setLoading(false)
      })

    return () => {
      realtimeAnalytics.unsubscribe(channelId, handleAssetUpdate)
    }
  }, [assetId])

  return { assetStatus, loading }
}

// Helper functions
function getActivityTitle(eventType: string): string {
  switch (eventType) {
    case "asset_created":
      return "New Asset Created"
    case "asset_updated":
      return "Asset Updated"
    case "asset_scanned":
      return "Asset Scanned"
    case "user_login":
      return "User Login"
    case "qr_generated":
      return "QR Code Generated"
    default:
      return "Activity"
  }
}

function getActivityDescription(event: AnalyticsEvent): string {
  switch (event.event_type) {
    case "asset_created":
      return `Asset ${event.asset_id} was added to inventory`
    case "asset_updated":
      return `Asset ${event.asset_id} was modified`
    case "asset_scanned":
      return `Asset ${event.asset_id} QR code was scanned`
    case "user_login":
      return "User logged into the system"
    case "qr_generated":
      return `QR code generated for asset ${event.asset_id}`
    default:
      return "System activity occurred"
  }
}
