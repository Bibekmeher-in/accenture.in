"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"
import { FALLBACK_BLOCKS } from "@/lib/blocks"

const ActionSchema = z.object({
  label: z.string().min(1).max(100),
  href: z.string().min(1).max(500),
})

const ContentBlockSchema = z.object({
  identifier: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Identifier must contain only lowercase letters, numbers, and hyphens"),
  title: z.string().min(1).max(200),
  type: z.enum(["cta", "banner", "hero", "announcement", "html"]),
  placement: z.enum(["global", "home", "services", "about", "portfolio", "blog", "careers", "store", "learning"]),
  heading: z.string().min(1).max(500),
  description: z.string().max(2000).default(""),
  badge: z.string().max(100).optional(),
  primaryAction: ActionSchema,
  secondaryAction: ActionSchema.optional(),
  customHtml: z.string().max(10000).optional(),
  imageUrl: z.string().max(1000).optional(),
  status: z.enum(["Published", "Draft", "Archived", "Disabled"]).default("Published"),
  orderRank: z.number().int().default(0),
})

export async function createContentBlock(data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = ContentBlockSchema.safeParse(data)
    if (!parsed.success) {
      console.error("ContentBlock validation error:", parsed.error)
      return { error: "Invalid content block data. Please check all required fields." }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Ensure unique identifier
    const existing = await db.collection("contentBlocks").findOne({ identifier: parsed.data.identifier })
    if (existing) {
      return { error: "A content block with this identifier already exists." }
    }

    const doc = {
      ...parsed.data,
      isProtected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("contentBlocks").insertOne(doc)

    await logAudit({
      actor: session.username,
      action: "CONTENT_BLOCK_CREATED",
      entity: "ContentBlock",
      entityId: result.insertedId.toString(),
      metadata: { identifier: parsed.data.identifier, title: parsed.data.title }
    })

    revalidatePath("/", "layout")
    revalidatePath("/admin/blocks")
    return { success: true, identifier: parsed.data.identifier }
  } catch (err) {
    console.error("createContentBlock error:", err)
    return { error: "Failed to create content block" }
  }
}

export async function updateContentBlock(id: string, data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      return { error: "Invalid block ID" }
    }

    const parsed = ContentBlockSchema.safeParse(data)
    if (!parsed.success) {
      console.error("ContentBlock validation error:", parsed.error)
      return { error: "Invalid content block data." }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Check identifier uniqueness against other blocks
    const existing = await db.collection("contentBlocks").findOne({
      identifier: parsed.data.identifier,
      _id: { $ne: new ObjectId(id) }
    })
    if (existing) {
      return { error: "Another block with this identifier already exists." }
    }

    await db.collection("contentBlocks").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: session.username,
      action: "CONTENT_BLOCK_UPDATED",
      entity: "ContentBlock",
      entityId: id,
      metadata: { identifier: parsed.data.identifier, title: parsed.data.title }
    })

    revalidatePath("/", "layout")
    revalidatePath("/admin/blocks")
    return { success: true }
  } catch (err) {
    console.error("updateContentBlock error:", err)
    return { error: "Failed to update content block" }
  }
}

export async function toggleBlockStatus(id: string, newStatus: "Published" | "Draft" | "Disabled" | "Archived") {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      // Check if it's a seed block not yet saved to DB
      const fallback = FALLBACK_BLOCKS.find(b => b.identifier === id)
      if (fallback) {
        const client = await clientPromise
        const db = client.db("accenture")
        await db.collection("contentBlocks").updateOne(
          { identifier: fallback.identifier },
          {
            $set: {
              ...fallback,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          },
          { upsert: true }
        )
        revalidatePath("/", "layout")
        revalidatePath("/admin/blocks")
        return { success: true }
      }
      return { error: "Invalid block ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("contentBlocks").updateOne(
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
      action: "CONTENT_BLOCK_STATUS_UPDATED",
      entity: "ContentBlock",
      entityId: id,
      metadata: { newStatus }
    })

    revalidatePath("/", "layout")
    revalidatePath("/admin/blocks")
    return { success: true }
  } catch (err) {
    console.error("toggleBlockStatus error:", err)
    return { error: "Failed to update block status" }
  }
}

export async function deleteContentBlock(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      return { error: "Invalid block ID or built-in system block cannot be hard-deleted. Disable or edit instead." }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const block = await db.collection("contentBlocks").findOne({ _id: new ObjectId(id) })
    if (!block) return { error: "Block not found" }

    if (block.isProtected) {
      // Protected core block: Archive rather than permanently remove to protect layout integrity
      await db.collection("contentBlocks").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "Archived",
            updatedAt: new Date().toISOString(),
          }
        }
      )

      await logAudit({
        actor: session.username,
        action: "CONTENT_BLOCK_ARCHIVED_PROTECTED",
        entity: "ContentBlock",
        entityId: id,
        metadata: { identifier: block.identifier, reason: "core_protected_block" }
      })

      revalidatePath("/", "layout")
      revalidatePath("/admin/blocks")
      return { success: true, message: "Protected block has been safely archived to maintain page layouts." }
    }

    await db.collection("contentBlocks").deleteOne({ _id: new ObjectId(id) })

    await logAudit({
      actor: session.username,
      action: "CONTENT_BLOCK_DELETED",
      entity: "ContentBlock",
      entityId: id,
      metadata: { identifier: block.identifier, title: block.title }
    })

    revalidatePath("/", "layout")
    revalidatePath("/admin/blocks")
    return { success: true }
  } catch (err) {
    console.error("deleteContentBlock error:", err)
    return { error: "Failed to delete content block" }
  }
}

export async function reorderBlocks(blockIds: string[]) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    for (let i = 0; i < blockIds.length; i++) {
      const id = blockIds[i]
      if (ObjectId.isValid(id)) {
        await db.collection("contentBlocks").updateOne(
          { _id: new ObjectId(id) },
          { $set: { orderRank: i + 1, updatedAt: new Date().toISOString() } }
        )
      }
    }

    await logAudit({
      actor: session.username,
      action: "CONTENT_BLOCKS_REORDERED",
      entity: "ContentBlock",
      metadata: { count: blockIds.length }
    })

    revalidatePath("/", "layout")
    revalidatePath("/admin/blocks")
    return { success: true }
  } catch {
    return { error: "Failed to reorder blocks" }
  }
}
