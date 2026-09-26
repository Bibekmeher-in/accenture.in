"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { z } from "zod"
import { logAudit } from "@/lib/audit"
import { deleteResumeFile } from "@/lib/storage"
import type { CareerApplicationDoc } from "@/lib/customer-types"

const ApplicationStatusEnum = z.enum([
  "Pending Review",
  "Under Consideration",
  "Interviewing",
  "Archived",
  "Rejected"
])

export async function updateApplicationStatus(applicationId: string, status: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) {
      return { error: "Unauthorized" }
    }

    const parsedStatus = ApplicationStatusEnum.safeParse(status)
    if (!parsedStatus.success) {
      return { error: "Invalid status" }
    }

    if (!ObjectId.isValid(applicationId)) {
      return { error: "Invalid application ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const now = new Date().toISOString()

    await db.collection("careerApplications").updateOne(
      { _id: new ObjectId(applicationId) },
      {
        $set: {
          status: parsedStatus.data,
          updatedAt: now,
        }
      }
    )

    await logAudit({
      actor: `Admin:${session.username}`,
      action: "CAREER_APPLICATION_STATUS_UPDATED",
      entity: "CareerApplication",
      entityId: applicationId,
      metadata: { newStatus: parsedStatus.data }
    })

    revalidatePath("/admin/careers")
    return { success: true }
  } catch (err) {
    console.error("updateApplicationStatus error:", err)
    return { error: "Failed to update application status" }
  }
}

export async function addApplicationNote(applicationId: string, text: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) {
      return { error: "Unauthorized" }
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      return { error: "Note cannot be empty" }
    }

    if (!ObjectId.isValid(applicationId)) {
      return { error: "Invalid application ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const now = new Date().toISOString()

    const newNote = {
      author: session.username,
      text: trimmedText,
      timestamp: now,
    }

    await db.collection("careerApplications").updateOne(
      { _id: new ObjectId(applicationId) },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $push: { notes: newNote } as any,
        $set: { updatedAt: now }
      }
    )

    await logAudit({
      actor: `Admin:${session.username}`,
      action: "CAREER_APPLICATION_NOTE_ADDED",
      entity: "CareerApplication",
      entityId: applicationId,
    })

    revalidatePath("/admin/careers")
    return { success: true, note: newNote }
  } catch (err) {
    console.error("addApplicationNote error:", err)
    return { error: "Failed to add note" }
  }
}

export async function deleteApplication(applicationId: string) {
  try {
    const session = await getSession()
    if (!session || !["super_admin", "admin"].includes(session.role)) {
      return { error: "Unauthorized" }
    }

    if (!ObjectId.isValid(applicationId)) {
      return { error: "Invalid application ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const application = await db.collection<CareerApplicationDoc>("careerApplications").findOne({
      _id: new ObjectId(applicationId)
    })

    if (application?.storageKey) {
      await deleteResumeFile(application.storageKey)
    }

    await db.collection("careerApplications").deleteOne({
      _id: new ObjectId(applicationId)
    })

    await logAudit({
      actor: `Admin:${session.username}`,
      action: "CAREER_APPLICATION_DELETED",
      entity: "CareerApplication",
      entityId: applicationId,
    })

    revalidatePath("/admin/careers")
    return { success: true }
  } catch (err) {
    console.error("deleteApplication error:", err)
    return { error: "Failed to delete application" }
  }
}
