"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { z } from "zod"
import { logAudit, logLeadActivity } from "@/lib/audit"

const LeadStatusEnum = z.enum(["new", "assigned", "contacted", "qualified", "proposal", "negotiation", "won", "lost", "closed"])
const LeadPriorityEnum = z.enum(["low", "normal", "high", "urgent"])

export async function updateLeadStatus(leadId: string, status: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) return { error: "Unauthorized" }

    const parsedStatus = LeadStatusEnum.safeParse(status)
    if (!parsedStatus.success) return { error: "Invalid status" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("leads").updateOne(
      { _id: new ObjectId(leadId) },
      { $set: { status: parsedStatus.data, updatedAt: new Date() } }
    )

    await logLeadActivity({
      leadId,
      action: "LEAD_STATUS_UPDATED",
      actor: session.username,
      metadata: { newStatus: parsedStatus.data }
    })

    await logAudit({
      actor: session.username,
      action: "LEAD_STATUS_UPDATED",
      entity: "lead",
      entityId: leadId,
      metadata: { newStatus: parsedStatus.data }
    })

    revalidatePath("/admin/leads")
    return { success: true }
  } catch {
    return { error: "Failed to update lead status" }
  }
}

export async function updateLeadPriority(leadId: string, priority: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) return { error: "Unauthorized" }

    const parsedPriority = LeadPriorityEnum.safeParse(priority)
    if (!parsedPriority.success) return { error: "Invalid priority" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("leads").updateOne(
      { _id: new ObjectId(leadId) },
      { $set: { priority: parsedPriority.data, updatedAt: new Date() } }
    )

    await logLeadActivity({
      leadId,
      action: "LEAD_PRIORITY_UPDATED",
      actor: session.username,
      metadata: { newPriority: parsedPriority.data }
    })

    await logAudit({
      actor: session.username,
      action: "LEAD_PRIORITY_UPDATED",
      entity: "lead",
      entityId: leadId,
      metadata: { newPriority: parsedPriority.data }
    })

    revalidatePath("/admin/leads")
    return { success: true }
  } catch {
    return { error: "Failed to update lead priority" }
  }
}

export async function addLeadNote(leadId: string, text: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) return { error: "Unauthorized" }

    if (!text || text.trim() === "") return { error: "Note cannot be empty" }

    const client = await clientPromise
    const db = client.db("accenture")

    const note = {
      author: session.username,
      text: text.trim(),
      timestamp: new Date()
    }

    await db.collection<{ notes?: unknown[]; updatedAt?: Date }>("leads").updateOne(
      { _id: new ObjectId(leadId) },
      {
        $push: { notes: note },
        $set: { updatedAt: new Date() }
      }
    )

    await logLeadActivity({
      leadId,
      action: "LEAD_NOTE_ADDED",
      actor: session.username,
      notes: "Added internal note"
    })

    await logAudit({
      actor: session.username,
      action: "LEAD_NOTE_ADDED",
      entity: "lead",
      entityId: leadId
    })

    revalidatePath("/admin/leads")
    return { success: true }
  } catch {
    return { error: "Failed to add note" }
  }
}

export async function setLeadFollowUp(leadId: string, date: string, reason: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) return { error: "Unauthorized" }

    const followUpDate = new Date(date)
    if (isNaN(followUpDate.getTime())) return { error: "Invalid date" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("leads").updateOne(
      { _id: new ObjectId(leadId) },
      {
        $set: {
          followUpDate,
          followUpReason: reason,
          updatedAt: new Date()
        }
      }
    )

    await logLeadActivity({
      leadId,
      action: "LEAD_FOLLOWUP_SET",
      actor: session.username,
      metadata: { followUpDate: date, reason }
    })

    await logAudit({
      actor: session.username,
      action: "LEAD_FOLLOWUP_SET",
      entity: "lead",
      entityId: leadId,
      metadata: { followUpDate: date }
    })

    revalidatePath("/admin/leads")
    return { success: true }
  } catch {
    return { error: "Failed to set follow-up" }
  }
}

export async function deleteLead(leadId: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== "super_admin") return { error: "Unauthorized. Super Admin only." }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("leads").deleteOne({ _id: new ObjectId(leadId) })

    await logAudit({
      actor: session.username,
      action: "LEAD_DELETED",
      entity: "lead",
      entityId: leadId
    })

    revalidatePath("/admin/leads")
    return { success: true }
  } catch {
    return { error: "Failed to delete lead" }
  }
}

export async function assignLead(leadId: string, assignedTo: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("leads").updateOne(
      { _id: new ObjectId(leadId) },
      { $set: { assignedTo, updatedAt: new Date() } }
    )

    await logLeadActivity({
      leadId,
      action: "LEAD_ASSIGNED",
      actor: session.username,
      metadata: { assignedTo }
    })

    await logAudit({
      actor: session.username,
      action: "LEAD_ASSIGNED",
      entity: "lead",
      entityId: leadId,
      metadata: { assignedTo }
    })

    revalidatePath("/admin/leads")
    return { success: true }
  } catch {
    return { error: "Failed to assign lead" }
  }
}

export async function getLeadActivities(leadId: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    const activities = await db.collection("leadActivities")
      .find({ leadId })
      .sort({ timestamp: -1 })
      .toArray()

    // Convert ObjectId and Dates to strings
    return {
      success: true,
      activities: activities.map(a => ({
        ...a,
        _id: a._id.toString(),
        timestamp: a.timestamp.toISOString()
      }))
    }
  } catch {
    return { error: "Failed to fetch activities" }
  }
}
