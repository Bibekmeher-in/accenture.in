"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const BlogPostSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  type: z.string().min(1).max(50),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
})

export async function createBlogPost(data: Record<string, string>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = BlogPostSchema.safeParse(data)
    if (!parsed.success) {
      return { error: "Invalid blog post data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Ensure slug is unique
    const existing = await db.collection("blog").findOne({ slug: parsed.data.slug })
    if (existing) {
      return { error: "A post with this slug already exists." }
    }

    await db.collection("blog").insertOne({
      ...parsed.data,
      date: new Date().toISOString(),
    })

    revalidatePath("/blog")
    revalidatePath("/admin/blog")
    return { success: true }
  } catch {
    return { error: "Failed to create post" }
  }
}

export async function deleteBlogPost(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("blog").deleteOne({ _id: new ObjectId(id) })

    revalidatePath("/blog")
    revalidatePath("/admin/blog")
    return { success: true }
  } catch {
    return { error: "Failed to delete post" }
  }
}
