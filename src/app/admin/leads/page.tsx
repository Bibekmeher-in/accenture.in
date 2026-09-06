import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { LeadsTable } from "./LeadsTable"

export const metadata: Metadata = {
  title: "Leads Management | Admin",
}

export default async function AdminLeadsPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  // Fetch leads sorted by newest first
  const leadsRaw = await db
    .collection("leads")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  // Convert MongoDB ObjectIds to strings to pass to Client Components safely
  const leads = leadsRaw.map(lead => ({
    _id: lead._id.toString(),
    name: lead.name,
    email: lead.email,
    company: lead.company || "",
    phone: lead.phone || "",
    service: lead.service,
    message: lead.message,
    status: lead.status || "new",
    priority: lead.priority || "normal",
    assignedTo: lead.assignedTo,
    followUpDate: lead.followUpDate ? lead.followUpDate.toISOString() : undefined,
    followUpReason: lead.followUpReason,
    notes: (lead.notes || []).map((n: Record<string, unknown>) => ({
      author: typeof n.author === "string" ? n.author : "Unknown",
      text: typeof n.text === "string" ? n.text : "",
      timestamp: n.timestamp instanceof Date ? n.timestamp.toISOString() : new Date().toISOString()
    })),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt ? lead.updatedAt.toISOString() : undefined,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-2">Manage inquiries and contact submissions.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <LeadsTable initialLeads={leads} />
      </div>
    </div>
  )
}
