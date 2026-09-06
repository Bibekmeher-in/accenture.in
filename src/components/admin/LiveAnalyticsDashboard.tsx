"use client"

import { useEffect, useState } from "react"
import { LineChart, BarChart3, Users, Globe2, Activity } from "lucide-react"

type AnalyticsStats = {
  activeVisitors: number
  activeSessions: number
  visitorsToday: number
  sessionsToday: number
  pageViewsToday: number
  topPages: { path: string; views: number }[]
  recentEvents: { eventType: string; pathname: string; timestamp: string }[]
  deviceBreakdown: { category: string; count: number }[]
}

export function LiveAnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let eventSource: EventSource | null = null

    const connectSSE = () => {
      eventSource = new EventSource("/api/admin/analytics/live")

      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setStats(data)
        } catch (e) {
          console.error("Failed to parse SSE data", e)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        setError("Connection lost. Reconnecting...")
      }
    }

    connectSSE()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  if (error && !stats) {
    return (
      <div className="bg-card border border-destructive/50 rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Analytics Unavailable</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center animate-pulse min-h-[400px] flex flex-col items-center justify-center">
        <Activity className="h-8 w-8 text-muted-foreground animate-bounce mb-4" />
        <h2 className="text-xl font-bold mb-2">Loading Analytics Data...</h2>
        <p className="text-muted-foreground">Connecting to real-time stream.</p>
      </div>
    )
  }

  const statCards = [
    { name: "Active Visitors (Last 5m)", icon: Activity, value: stats.activeVisitors, color: "text-green-500", bg: "bg-green-500/10" },
    { name: "Total Visitors Today", icon: Users, value: stats.visitorsToday, color: "text-primary", bg: "bg-primary/10" },
    { name: "Page Views Today", icon: Globe2, value: stats.pageViewsToday, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Sessions Today", icon: BarChart3, value: stats.sessionsToday, color: "text-purple-500", bg: "bg-purple-500/10" },
  ]

  const hasData = stats.visitorsToday > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        <span className="text-sm font-medium text-muted-foreground">
          {isConnected ? "Live (Updates every 10s)" : "Disconnected"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 transition-all hover:shadow-md">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {!hasData ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center min-h-[300px] flex flex-col justify-center border-dashed">
          <h2 className="text-xl font-bold mb-2">No analytics data yet.</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Once visitors start interacting with your website (and accept cookies), metrics will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-muted-foreground" />
              Top Pages Today
            </h3>
            <div className="space-y-3">
              {stats.topPages.length > 0 ? stats.topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                  <span className="text-sm font-medium truncate max-w-[70%]">{page.path}</span>
                  <span className="text-sm font-bold bg-secondary px-2 py-1 rounded-md">{page.views} views</span>
                </div>
              )) : <div className="text-sm text-muted-foreground">No page views yet.</div>}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-muted-foreground" />
              Device Breakdown Today
            </h3>
            <div className="space-y-3">
              {stats.deviceBreakdown.length > 0 ? stats.deviceBreakdown.map((device, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                  <span className="text-sm font-medium capitalize">{device.category}</span>
                  <span className="text-sm font-bold bg-secondary px-2 py-1 rounded-md">{device.count} sessions</span>
                </div>
              )) : <div className="text-sm text-muted-foreground">No device data yet.</div>}
            </div>
          </div>

          {/* Recent Events (Full Width) */}
          <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-md">Event</th>
                    <th className="px-4 py-3">Path</th>
                    <th className="px-4 py-3 rounded-tr-md text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEvents.map((event, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">{event.eventType}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{event.pathname}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.recentEvents.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
