"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const PortfolioProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  type: z.string().min(1).max(50),
  tags: z.string().optional(),
})

export async function createPortfolioProject(data: Record<string, string>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = PortfolioProjectSchema.safeParse(data)
    if (!parsed.success) {
      return { error: "Invalid portfolio project data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Parse tags from comma-separated string
    const tags = parsed.data.tags ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : []

    await db.collection("portfolio").insertOne({
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      tags,
      createdAt: new Date().toISOString(),
    })

    revalidatePath("/portfolio")
    revalidatePath("/admin/portfolio")
    return { success: true }
  } catch {
    return { error: "Failed to create project" }
  }
}

export async function deletePortfolioProject(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("portfolio").deleteOne({ _id: new ObjectId(id) })

    revalidatePath("/portfolio")
    revalidatePath("/admin/portfolio")
    return { success: true }
  } catch {
    return { error: "Failed to delete project" }
  }
}
