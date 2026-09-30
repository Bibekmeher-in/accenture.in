"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const BlogPostSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  type: z.string().min(1).max(50),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  status: z.enum(["Published", "Draft", "Archived"]).default("Published"),
  featured: z.boolean().default(false),
})

export async function createBlogPost(data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = BlogPostSchema.safeParse({
      ...data,
      status: data.status || "Published",
      featured: data.featured === true || data.featured === "true" || data.featured === "on",
    })

    if (!parsed.success) {
      return { error: "Invalid blog post data. Ensure slug contains only lowercase letters, numbers, and hyphens." }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Ensure slug is unique
    const existing = await db.collection("blog").findOne({ slug: parsed.data.slug })
    if (existing) {
      return { error: "A post with this slug already exists." }
    }

    const result = await db.collection("blog").insertOne({
      ...parsed.data,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await logAudit({
      actor: session.username,
      action: "BLOG_CREATED",
      entity: "blog",
      entityId: result.insertedId.toString(),
      metadata: { title: parsed.data.title, slug: parsed.data.slug, category: parsed.data.category },
    })

    revalidatePath("/blog")
    revalidatePath(`/blog/${parsed.data.slug}`)
    revalidatePath("/admin/blog")
    return { success: true }
  } catch {
    return { error: "Failed to create post" }
  }
}

export async function updateBlogPost(id: string, data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = BlogPostSchema.safeParse({
      ...data,
      status: data.status || "Published",
      featured: data.featured === true || data.featured === "true" || data.featured === "on",
    })

    if (!parsed.success) {
      return { error: "Invalid blog post data. Ensure slug contains only lowercase letters, numbers, and hyphens." }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Check slug collision with other articles
    const existing = await db.collection("blog").findOne({
      _id: { $ne: new ObjectId(id) },
      slug: parsed.data.slug,
    })
    if (existing) {
      return { error: "Another blog post already uses this slug." }
    }

    const updateRes = await db.collection("blog").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date().toISOString(),
        },
      }
    )

    if (updateRes.matchedCount === 0) {
      return { error: "Blog post not found" }
    }

    await logAudit({
      actor: session.username,
      action: "BLOG_UPDATED",
      entity: "blog",
      entityId: id,
      metadata: { title: parsed.data.title, slug: parsed.data.slug, category: parsed.data.category },
    })

    revalidatePath("/blog")
    revalidatePath(`/blog/${parsed.data.slug}`)
    revalidatePath("/admin/blog")
    return { success: true }
  } catch {
    return { error: "Failed to update blog post" }
  }
}

export async function toggleBlogStatus(id: string, newStatus: "Published" | "Draft" | "Archived") {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) return { error: "Invalid post ID" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("blog").updateOne(
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
      action: "BLOG_STATUS_UPDATED",
      entity: "blog",
      entityId: id,
      metadata: { newStatus }
    })

    revalidatePath("/blog")
    revalidatePath("/admin/blog")
    return { success: true }
  } catch {
    return { error: "Failed to update blog status" }
  }
}

export async function deleteBlogPost(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    if (!ObjectId.isValid(id)) {
      return { error: "Invalid post ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const post = await db.collection("blog").findOne({ _id: new ObjectId(id) })
    if (!post) {
      return { error: "Blog post not found" }
    }

    await db.collection("blog").deleteOne({ _id: new ObjectId(id) })

    await logAudit({
      actor: session.username,
      action: "BLOG_DELETED",
      entity: "blog",
      entityId: id,
      metadata: { title: post.title, slug: post.slug },
    })

    revalidatePath("/blog")
    revalidatePath(`/blog/${post.slug}`)
    revalidatePath("/admin/blog")
    return { success: true }
  } catch {
    return { error: "Failed to delete post" }
  }
}
