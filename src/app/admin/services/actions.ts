"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const ServiceSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1).max(1000),
  icon: z.string().optional(),
  introduction: z.string().max(2000).optional(),
  covers: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  status: z.enum(["Published", "Draft"]).default("Published"),
  orderRank: z.number().int().default(0),
})

export async function createService(data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    // Parse covers & benefits if submitted as string (newline or comma separated)
    let coversArray: string[] = []
    if (typeof data.covers === "string") {
      coversArray = data.covers.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    } else if (Array.isArray(data.covers)) {
      coversArray = data.covers
    }

    let benefitsArray: string[] = []
    if (typeof data.benefits === "string") {
      benefitsArray = data.benefits.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    } else if (Array.isArray(data.benefits)) {
      benefitsArray = data.benefits
    }

    const payload = {
      ...data,
      covers: coversArray,
      benefits: benefitsArray,
      orderRank: Number(data.orderRank) || 0,
      status: data.status || "Published",
    }

    const parsed = ServiceSchema.safeParse(payload)
    if (!parsed.success) {
      console.error("Service validation error:", parsed.error)
      return { error: "Invalid service data. Ensure slug has valid format." }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Check slug uniqueness
    const existing = await db.collection("services").findOne({ slug: parsed.data.slug })
    if (existing) {
      return { error: "A service with this slug already exists." }
    }

    const doc = {
      ...parsed.data,
      icon: parsed.data.icon || "LayoutTemplate",
      introduction: parsed.data.introduction || parsed.data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("services").insertOne(doc)

    await logAudit({
      actor: session.username,
      action: "SERVICE_CREATED",
      entity: "Service",
      entityId: result.insertedId.toString(),
      metadata: { title: parsed.data.title, slug: parsed.data.slug }
    })

    revalidatePath("/services")
    revalidatePath(`/services/${parsed.data.slug}`)
    revalidatePath("/admin/services")
    return { success: true }
  } catch (err) {
    console.error("createService error:", err)
    return { error: "Failed to create service" }
  }
}

export async function updateService(id: string, data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      return { error: "Invalid service ID" }
    }

    let coversArray: string[] = []
    if (typeof data.covers === "string") {
      coversArray = data.covers.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    } else if (Array.isArray(data.covers)) {
      coversArray = data.covers
    }

    let benefitsArray: string[] = []
    if (typeof data.benefits === "string") {
      benefitsArray = data.benefits.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    } else if (Array.isArray(data.benefits)) {
      benefitsArray = data.benefits
    }

    const payload = {
      ...data,
      covers: coversArray,
      benefits: benefitsArray,
      orderRank: Number(data.orderRank) || 0,
      status: data.status || "Published",
    }

    const parsed = ServiceSchema.safeParse(payload)
    if (!parsed.success) {
      return { error: "Invalid service data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Check slug uniqueness across other services
    const existing = await db.collection("services").findOne({
      slug: parsed.data.slug,
      _id: { $ne: new ObjectId(id) }
    })
    if (existing) {
      return { error: "Slug is already used by another service" }
    }

    await db.collection("services").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...parsed.data,
          icon: parsed.data.icon || "LayoutTemplate",
          introduction: parsed.data.introduction || parsed.data.description,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: session.username,
      action: "SERVICE_UPDATED",
      entity: "Service",
      entityId: id,
      metadata: { title: parsed.data.title, slug: parsed.data.slug }
    })

    revalidatePath("/services")
    revalidatePath(`/services/${parsed.data.slug}`)
    revalidatePath("/admin/services")
    return { success: true }
  } catch (err) {
    console.error("updateService error:", err)
    return { error: "Failed to update service" }
  }
}

export async function toggleServiceStatus(id: string, newStatus: "Published" | "Draft") {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      return { error: "Invalid service ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("services").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: session.username,
      action: "SERVICE_STATUS_UPDATED",
      entity: "Service",
      entityId: id,
      metadata: { newStatus }
    })

    revalidatePath("/services")
    revalidatePath("/admin/services")
    return { success: true }
  } catch {
    return { error: "Failed to update service status" }
  }
}

export async function deleteService(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      return { error: "Invalid service ID" }
    }

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
