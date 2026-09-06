"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const LearningSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.string().min(1).max(100),
  isPublished: z.boolean(),
  order: z.number().int().default(0),
})

export async function createCourse(data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = LearningSchema.safeParse({
      title: data.title,
      description: data.description,
      category: data.category,
      isPublished: data.isPublished === "true" || data.isPublished === true,
      order: parseInt(String(data.order || "0"), 10),
    })

    if (!parsed.success) {
      return { error: "Invalid course data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const result = await db.collection("learning").insertOne({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      isPublished: parsed.data.isPublished,
      order: parsed.data.order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await logAudit({
      actor: session.username,
      action: "LEARNING_COURSE_CREATED",
      entity: "Learning",
      entityId: result.insertedId.toString(),
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/learning")
    revalidatePath("/admin/learning")
    return { success: true }
  } catch {
    return { error: "Failed to create course" }
  }
}

export async function updateCourse(id: string, data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = LearningSchema.safeParse({
      title: data.title,
      description: data.description,
      category: data.category,
      isPublished: data.isPublished === "true" || data.isPublished === true,
      order: parseInt(String(data.order || "0"), 10),
    })

    if (!parsed.success) {
      return { error: "Invalid course data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("learning").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          isPublished: parsed.data.isPublished,
          order: parsed.data.order,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: session.username,
      action: "LEARNING_COURSE_UPDATED",
      entity: "Learning",
      entityId: id,
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/learning")
    revalidatePath("/admin/learning")
    return { success: true }
  } catch {
    return { error: "Failed to update course" }
  }
}

export async function deleteCourse(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    const courseToDelete = await db.collection("learning").findOne({ _id: new ObjectId(id) })
    if (!courseToDelete) return { error: "Course not found" }

    await db.collection("learning").deleteOne({ _id: new ObjectId(id) })

    await logAudit({
      actor: session.username,
      action: "LEARNING_COURSE_DELETED",
      entity: "Learning",
      entityId: id,
      metadata: { title: courseToDelete.title }
    })

    revalidatePath("/learning")
    revalidatePath("/admin/learning")
    return { success: true }
  } catch {
    return { error: "Failed to delete course" }
  }
}
