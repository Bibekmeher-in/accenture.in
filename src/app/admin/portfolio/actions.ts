"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const PortfolioProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  type: z.string().min(1).max(50),
  tags: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(["Published", "Draft", "Archived"]).default("Published"),
  orderRank: z.number().int().default(0),
  featured: z.boolean().default(false),
})

export async function createPortfolioProject(data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = PortfolioProjectSchema.safeParse({
      ...data,
      featured: data.featured === true || data.featured === "true" || data.featured === "on",
      orderRank: Number(data.orderRank) || 0,
      status: data.status || "Published",
    })

    if (!parsed.success) {
      return { error: "Invalid portfolio project data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const tags = parsed.data.tags ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : []

    const result = await db.collection("portfolio").insertOne({
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      tags,
      imageUrl: parsed.data.imageUrl || "",
      status: parsed.data.status,
      orderRank: parsed.data.orderRank,
      featured: parsed.data.featured,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await logAudit({
      actor: session.username,
      action: "PORTFOLIO_CREATED",
      entity: "Portfolio",
      entityId: result.insertedId.toString(),
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/portfolio")
    revalidatePath("/admin/portfolio")
    return { success: true }
  } catch {
    return { error: "Failed to create project" }
  }
}

export async function updatePortfolioProject(id: string, data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      return { error: "Invalid project ID" }
    }

    const parsed = PortfolioProjectSchema.safeParse({
      ...data,
      featured: data.featured === true || data.featured === "true" || data.featured === "on",
      orderRank: Number(data.orderRank) || 0,
      status: data.status || "Published",
    })

    if (!parsed.success) {
      return { error: "Invalid portfolio project data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const tags = parsed.data.tags ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : []

    await db.collection("portfolio").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: parsed.data.title,
          description: parsed.data.description,
          type: parsed.data.type,
          tags,
          imageUrl: parsed.data.imageUrl || "",
          status: parsed.data.status,
          orderRank: parsed.data.orderRank,
          featured: parsed.data.featured,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: session.username,
      action: "PORTFOLIO_UPDATED",
      entity: "Portfolio",
      entityId: id,
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/portfolio")
    revalidatePath("/admin/portfolio")
    return { success: true }
  } catch (err) {
    console.error("updatePortfolioProject error:", err)
    return { error: "Failed to update project" }
  }
}

export async function toggleProjectStatus(id: string, newStatus: "Published" | "Draft" | "Archived") {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) return { error: "Invalid project ID" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("portfolio").updateOne(
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
      action: "PORTFOLIO_STATUS_UPDATED",
      entity: "Portfolio",
      entityId: id,
      metadata: { newStatus }
    })

    revalidatePath("/portfolio")
    revalidatePath("/admin/portfolio")
    return { success: true }
  } catch {
    return { error: "Failed to update project status" }
  }
}

export async function deletePortfolioProject(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      return { error: "Invalid project ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const project = await db.collection("portfolio").findOne({ _id: new ObjectId(id) })
    if (!project) return { error: "Project not found" }

    await db.collection("portfolio").deleteOne({ _id: new ObjectId(id) })

    await logAudit({
      actor: session.username,
      action: "PORTFOLIO_DELETED",
      entity: "Portfolio",
      entityId: id,
      metadata: { title: project.title }
    })

    revalidatePath("/portfolio")
    revalidatePath("/admin/portfolio")
    return { success: true }
  } catch {
    return { error: "Failed to delete project" }
  }
}
