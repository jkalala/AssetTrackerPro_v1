"use client"

import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface RealtimeEvent {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  record: any
  old_record?: any
  timestamp: string
}

export interface AnalyticsEvent {
  id: string
  event_type: "asset_created" | "asset_updated" | "asset_scanned" | "user_login" | "qr_generated"
  asset_id?: string
  user_id?: string
  metadata?: Record<string, any>
  timestamp: string
}

class RealtimeAnalytics {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private eventListeners: Map<string, Set<(event: RealtimeEvent) => void>> = new Map()
  private analyticsListeners: Set<(event: AnalyticsEvent) => void> = new Set()

  // Subscribe to real-time table changes
  subscribeToTable(table: string, callback: (event: RealtimeEvent) => void, filter?: { column: string; value: any }) {
    const channelName = filter ? `${table}_${filter.column}_${filter.value}` : table

    if (this.channels.has(channelName)) {
      // Add listener to existing channel
      const listeners = this.eventListeners.get(channelName) || new Set()
      listeners.add(callback)
      this.eventListeners.set(channelName, listeners)
      return channelName
    }

    // Create new channel
    let channel = this.supabase.channel(channelName)

    if (filter) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType as any,
            table: table,
            record: payload.new,
            old_record: payload.old,
            timestamp: new Date().toISOString(),
          }

          // Notify all listeners for this channel
          const listeners = this.eventListeners.get(channelName) || new Set()
          listeners.forEach((listener) => listener(event))
        },
      )
    } else {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType as any,
            table: table,
            record: payload.new,
            old_record: payload.old,
            timestamp: new Date().toISOString(),
          }

          // Notify all listeners for this channel
          const listeners = this.eventListeners.get(channelName) || new Set()
          listeners.forEach((listener) => listener(event))
        },
      )
    }

    channel.subscribe()
    this.channels.set(channelName, channel)

    // Add the callback to listeners
    const listeners = new Set([callback])
    this.eventListeners.set(channelName, listeners)

    return channelName
  }

  // Unsubscribe from a channel
  unsubscribe(channelName: string, callback?: (event: RealtimeEvent) => void) {
    if (callback) {
      const listeners = this.eventListeners.get(channelName)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.eventListeners.delete(channelName)
          const channel = this.channels.get(channelName)
          if (channel) {
            this.supabase.removeChannel(channel)
            this.channels.delete(channelName)
          }
        }
      }
    } else {
      // Remove entire channel
      const channel = this.channels.get(channelName)
      if (channel) {
        this.supabase.removeChannel(channel)
        this.channels.delete(channelName)
        this.eventListeners.delete(channelName)
      }
    }
  }

  // Subscribe to analytics events
  subscribeToAnalytics(callback: (event: AnalyticsEvent) => void) {
    this.analyticsListeners.add(callback)

    // Subscribe to analytics_events table if it exists
    this.subscribeToTable("analytics_events", (event) => {
      if (event.type === "INSERT" && event.record) {
        const analyticsEvent: AnalyticsEvent = {
          id: event.record.id,
          event_type: event.record.event_type,
          asset_id: event.record.asset_id,
          user_id: event.record.user_id,
          metadata: event.record.metadata,
          timestamp: event.record.created_at || event.timestamp,
        }

        this.analyticsListeners.forEach((listener) => listener(analyticsEvent))
      }
    })
  }

  // Track analytics event
  async trackEvent(event: Omit<AnalyticsEvent, "id" | "timestamp">) {
    try {
      const { error } = await this.supabase.from("analytics_events").insert({
        event_type: event.event_type,
        asset_id: event.asset_id,
        user_id: event.user_id,
        metadata: event.metadata,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Failed to track analytics event:", error)
      }
    } catch (error) {
      console.error("Analytics tracking error:", error)
    }
  }

  // Get real-time metrics
  async getRealtimeMetrics() {
    try {
      const [assetsResult, usersResult, scansResult] = await Promise.all([
        this.supabase.from("assets").select("id, status, created_at").order("created_at", { ascending: false }),
        this.supabase.from("profiles").select("id, created_at").order("created_at", { ascending: false }),
        this.supabase
          .from("analytics_events")
          .select("*")
          .eq("event_type", "asset_scanned")
          .order("created_at", { ascending: false })
          .limit(100),
      ])

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      return {
        totalAssets: assetsResult.data?.length || 0,
        activeAssets: assetsResult.data?.filter((a) => a.status === "active").length || 0,
        assetsCreatedToday: assetsResult.data?.filter((a) => new Date(a.created_at) >= today).length || 0,
        totalUsers: usersResult.data?.length || 0,
        scansThisWeek: scansResult.data?.filter((s) => new Date(s.created_at) >= thisWeek).length || 0,
        recentScans: scansResult.data?.slice(0, 10) || [],
      }
    } catch (error) {
      console.error("Failed to get realtime metrics:", error)
      return {
        totalAssets: 0,
        activeAssets: 0,
        assetsCreatedToday: 0,
        totalUsers: 0,
        scansThisWeek: 0,
        recentScans: [],
      }
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.eventListeners.clear()
    this.analyticsListeners.clear()
  }
}

// Export singleton instance
export const realtimeAnalytics = new RealtimeAnalytics()
