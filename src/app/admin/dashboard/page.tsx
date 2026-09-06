import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { Users, FileText, FolderGit2, LayoutTemplate, Clock, Target, CheckCircle2, XCircle, CalendarClock } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin Dashboard | Accenture.in",
}

export default async function AdminDashboardPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const now = new Date()

  // Pipeline Metrics
  const leadsCount = await db.collection("leads").countDocuments()
  const newLeadsCount = await db.collection("leads").countDocuments({ status: "new" })
  const openLeadsCount = await db.collection("leads").countDocuments({ status: { $in: ["new", "assigned", "contacted", "qualified", "proposal", "negotiation"] } })
  const wonLeadsCount = await db.collection("leads").countDocuments({ status: "won" })
  const lostLeadsCount = await db.collection("leads").countDocuments({ status: "lost" })

  // Followups due today or earlier
  const followUpsDue = await db.collection("leads").countDocuments({
    followUpDate: { $lte: now },
    status: { $nin: ["closed", "won", "lost"] }
  })

  // Content Metrics
  const blogCount = await db.collection("blog").countDocuments()
  const portfolioCount = await db.collection("portfolio").countDocuments()
  const servicesCount = await db.collection("services").countDocuments()

  // Get recent activity
  const recentLeads = await db.collection("leads").find({}).sort({ createdAt: -1 }).limit(5).toArray()
  const recentAudit = await db.collection("auditLogs").find({}).sort({ timestamp: -1 }).limit(5).toArray()

  const stats = [
    { name: "Total Leads", value: leadsCount, icon: Users, desc: `${newLeadsCount} new unread`, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Open Pipeline", value: openLeadsCount, icon: Target, desc: "Active prospects", color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "Won Deals", value: wonLeadsCount, icon: CheckCircle2, desc: "Successfully closed", color: "text-green-500", bg: "bg-green-500/10" },
    { name: "Lost Deals", value: lostLeadsCount, icon: XCircle, desc: "Unsuccessful", color: "text-red-500", bg: "bg-red-500/10" },
    { name: "Follow-ups Due", value: followUpsDue, icon: CalendarClock, desc: "Action required", color: "text-orange-500", bg: "bg-orange-500/10" },
    { name: "Services", value: servicesCount, icon: LayoutTemplate, desc: "Active service offerings", color: "text-primary", bg: "bg-primary/10" },
    { name: "Blog Articles", value: blogCount, icon: FileText, desc: "Published articles", color: "text-primary", bg: "bg-primary/10" },
    { name: "Portfolio Items", value: portfolioCount, icon: FolderGit2, desc: "Projects in DB", color: "text-primary", bg: "bg-primary/10" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your business pipeline and platform activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {stat.desc}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Leads */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[300px]">
          <h2 className="text-lg font-bold mb-4 flex items-center"><Users className="h-5 w-5 mr-2 text-primary" /> Recent Leads</h2>
          {recentLeads.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
              No data yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead._id.toString()} className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${lead.status === "new" ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"}`}>
                      {lead.status || "new"}
                    </span>
                    {lead.priority && lead.priority !== "normal" && (
                      <div className="text-[10px] uppercase mt-1 text-muted-foreground font-semibold">
                        P: {lead.priority}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[300px]">
          <h2 className="text-lg font-bold mb-4 flex items-center"><Clock className="h-5 w-5 mr-2 text-primary" /> System Activity</h2>
          {recentAudit.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
              No data yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentAudit.map((log) => (
                <div key={log._id.toString()} className="flex flex-col gap-1 p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium"><span className="text-primary">{log.actor}</span> performed <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{log.action}</span></p>
                    <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toISOString().split('T')[0]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{log.entity} {log.entityId ? `(${log.entityId.slice(0,8)})` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
