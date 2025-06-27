"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, Scan, QrCode, User, Edit, Clock, Activity } from "lucide-react"
import type { ActivityFeed } from "@/hooks/use-realtime-analytics"

interface LiveActivityFeedProps {
  activities: ActivityFeed[]
}

export default function LiveActivityFeed({ activities }: LiveActivityFeedProps) {
  const [newActivityCount, setNewActivityCount] = useState(0)
  const [lastActivityTime, setLastActivityTime] = useState<string | null>(null)

  useEffect(() => {
    if (activities.length > 0 && lastActivityTime) {
      const newActivities = activities.filter((activity) => new Date(activity.timestamp) > new Date(lastActivityTime))
      setNewActivityCount(newActivities.length)
    }

    if (activities.length > 0) {
      setLastActivityTime(activities[0].timestamp)
    }
  }, [activities, lastActivityTime])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "asset_created":
        return <Package className="h-4 w-4 text-blue-600" />
      case "asset_updated":
        return <Edit className="h-4 w-4 text-orange-600" />
      case "asset_scanned":
        return <Scan className="h-4 w-4 text-green-600" />
      case "qr_generated":
        return <QrCode className="h-4 w-4 text-purple-600" />
      case "user_login":
        return <User className="h-4 w-4 text-indigo-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "asset_created":
        return "bg-blue-100 border-blue-200"
      case "asset_updated":
        return "bg-orange-100 border-orange-200"
      case "asset_scanned":
        return "bg-green-100 border-green-200"
      case "qr_generated":
        return "bg-purple-100 border-purple-200"
      case "user_login":
        return "bg-indigo-100 border-indigo-200"
      default:
        return "bg-gray-100 border-gray-200"
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Header with live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live Feed</span>
        </div>
        {newActivityCount > 0 && (
          <Badge variant="default" className="animate-bounce">
            {newActivityCount} new
          </Badge>
        )}
      </div>

      {/* Activity List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${getActivityColor(activity.type)} ${
                  index === 0 ? "ring-2 ring-blue-200 animate-pulse" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center pt-2 border-t">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-refreshing every 5 seconds</span>
        </div>
      </div>
    </div>
  )
}
