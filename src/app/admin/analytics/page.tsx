import { Metadata } from "next"
import { requireRole } from "@/lib/auth"
import { notFound } from "next/navigation"
import { LiveAnalyticsDashboard } from "@/components/admin/LiveAnalyticsDashboard"

export const metadata: Metadata = {
  title: "Analytics | Admin Portal",
}

export default async function AdminAnalyticsPage() {
  const { authorized } = await requireRole("super_admin")
  if (!authorized) return notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">Real-time privacy-safe visitor and activity analytics.</p>
      </div>

      <LiveAnalyticsDashboard />
    </div>
  )
}
