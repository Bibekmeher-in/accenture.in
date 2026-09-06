import clientPromise from "@/lib/mongodb"

export interface AnalyticsStats {
  activeVisitors: number
  activeSessions: number
  visitorsToday: number
  sessionsToday: number
  pageViewsToday: number
  topPages: { path: string; views: number }[]
  recentEvents: { eventType: string; pathname: string; timestamp: Date }[]
  deviceBreakdown: { category: string; count: number }[]
}

export async function getLiveAnalyticsStats(): Promise<AnalyticsStats> {
  const client = await clientPromise
  const db = client.db("accenture")

  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  // 1. Active sessions (last 5 minutes)
  const activeSessionsCount = await db.collection("analyticsSessions").countDocuments({
    lastActiveAt: { $gte: fiveMinutesAgo }
  })

  // 2. Active visitors (unique visitorIds in active sessions)
  // We can aggregate this
  const activeVisitorsAgg = await db.collection("analyticsSessions").aggregate([
    { $match: { lastActiveAt: { $gte: fiveMinutesAgo } } },
    { $group: { _id: "$visitorId" } },
    { $count: "count" }
  ]).toArray()
  const activeVisitorsCount = activeVisitorsAgg[0]?.count || 0

  // 3. Today's stats
  const sessionsToday = await db.collection("analyticsSessions").countDocuments({
    startedAt: { $gte: startOfDay }
  })

  const visitorsTodayAgg = await db.collection("analyticsSessions").aggregate([
    { $match: { startedAt: { $gte: startOfDay } } },
    { $group: { _id: "$visitorId" } },
    { $count: "count" }
  ]).toArray()
  const visitorsToday = visitorsTodayAgg[0]?.count || 0

  const pageViewsToday = await db.collection("analyticsEvents").countDocuments({
    eventType: "page_view",
    timestamp: { $gte: startOfDay }
  })

  // 4. Top pages today
  const topPagesAgg = await db.collection("analyticsEvents").aggregate([
    { $match: { eventType: "page_view", timestamp: { $gte: startOfDay } } },
    { $group: { _id: "$pathname", views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: 5 }
  ]).toArray()
  const topPages = topPagesAgg.map(p => ({ path: p._id, views: p.views }))

  // 5. Recent events (last 10)
  const recentEventsAgg = await db.collection("analyticsEvents")
    .find({}, { projection: { eventType: 1, pathname: 1, timestamp: 1, _id: 0 } })
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray()

  // 6. Device Breakdown (sessions today)
  const deviceAgg = await db.collection("analyticsSessions").aggregate([
    { $match: { startedAt: { $gte: startOfDay } } },
    { $group: { _id: "$deviceCategory", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray()

  const deviceBreakdown = deviceAgg.map(d => ({
    category: d._id || "unknown",
    count: d.count
  }))

  return {
    activeVisitors: activeVisitorsCount,
    activeSessions: activeSessionsCount,
    visitorsToday,
    sessionsToday,
    pageViewsToday,
    topPages,
    recentEvents: recentEventsAgg as unknown as { eventType: string; pathname: string; timestamp: Date }[],
    deviceBreakdown
  }
}
