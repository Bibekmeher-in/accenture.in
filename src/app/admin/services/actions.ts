"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const ServiceSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  icon: z.string().optional(),
})

export async function createService(data: Record<string, string>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = ServiceSchema.safeParse(data)
    if (!parsed.success) {
      return { error: "Invalid service data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Check slug uniqueness
    const existing = await db.collection("services").findOne({ slug: parsed.data.slug })
    if (existing) {
      return { error: "Slug must be unique" }
    }

    const result = await db.collection("services").insertOne({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      icon: parsed.data.icon || "LayoutTemplate",
      createdAt: new Date().toISOString(),
    })

    await logAudit({
      actor: session.username,
      action: "SERVICE_CREATED",
      entity: "Service",
      entityId: result.insertedId.toString(),
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/services")
    revalidatePath("/admin/services")
    return { success: true }
  } catch {
    return { error: "Failed to create service" }
  }
}

export async function deleteService(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    const serviceToDelete = await db.collection("services").findOne({ _id: new ObjectId(id) })
    if (!serviceToDelete) return { error: "Service not found" }

    await db.collection("services").deleteOne({ _id: new ObjectId(id) })

    await logAudit({
      actor: session.username,
      action: "SERVICE_DELETED",
      entity: "Service",
      entityId: id,
      metadata: { title: serviceToDelete.title }
    })

    revalidatePath("/services")
    revalidatePath("/admin/services")
    return { success: true }
  } catch {
    return { error: "Failed to delete service" }
  }
}
