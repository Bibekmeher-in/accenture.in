import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import { ShieldAlert } from "lucide-react"

export const metadata: Metadata = {
  title: "Audit Logs | Admin Portal",
}

export default async function AuditLogsPage() {
  const { authorized } = await requireRole("super_admin")
  if (!authorized) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Unauthorized: You must be a Super Admin to view this page.
      </div>
    )
  }

  const client = await clientPromise
  const db = client.db("accenture")

  const logs = await db.collection("auditLogs").find({}).sort({ timestamp: -1 }).limit(100).toArray()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">View the most recent 100 administrative actions.</p>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-card">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground">No logs found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mb-6">
            No administrative actions have been logged yet.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Actor</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Entity</th>
                <th className="px-6 py-4 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log._id.toString()} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 16)}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{log.actor}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{log.entity} {log.entityId ? `(${log.entityId.slice(0,6)}...)` : ''}</td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground max-w-[200px] truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
