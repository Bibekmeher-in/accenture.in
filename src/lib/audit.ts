import clientPromise from "@/lib/mongodb"

export type AuditAction =
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "LEAD_STATUS_UPDATED"
  | "LEAD_PRIORITY_UPDATED"
  | "LEAD_ASSIGNED"
  | "LEAD_DELETED"
  | "LEAD_NOTE_ADDED"
  | "LEAD_FOLLOWUP_SET"
  | "BLOG_CREATED"
  | "BLOG_UPDATED"
  | "BLOG_DELETED"
  | "PORTFOLIO_CREATED"
  | "PORTFOLIO_UPDATED"
  | "PORTFOLIO_DELETED"
  | "SERVICE_CREATED"
  | "SERVICE_UPDATED"
  | "SERVICE_DELETED"
  | "ADMIN_CREATED"
  | "ADMIN_ROLE_CHANGED"
  | "ADMIN_DELETED"
  | "SETTINGS_UPDATED"
  | "LEARNING_COURSE_CREATED"
  | "LEARNING_COURSE_UPDATED"
  | "LEARNING_COURSE_DELETED"
  | "STORE_PRODUCT_CREATED"
  | "STORE_PRODUCT_UPDATED"
  | "STORE_PRODUCT_DELETED"

export interface AuditLogEntry {
  actor: string // username
  action: AuditAction
  entity: string
  entityId?: string
  metadata?: Record<string, unknown>
  timestamp: Date
}

export async function logAudit(entry: Omit<AuditLogEntry, "timestamp">) {
  try {
    const client = await clientPromise
    const db = client.db("accenture")
    await db.collection("auditLogs").insertOne({
      ...entry,
      timestamp: new Date()
    })
  } catch (error) {
    // We swallow the error to not break the main transaction, but log it internally
    console.error("Failed to write audit log:", error)
  }
}

export async function logLeadActivity({
  leadId,
  action,
  actor,
  notes,
  metadata
}: {
  leadId: string
  action: string
  actor: string
  notes?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("leadActivities").insertOne({
      leadId,
      timestamp: new Date(),
      action,
      actor,
      notes,
      metadata
    })
  } catch (err) {
    console.error("Failed to write lead activity log:", err)
  }
}
