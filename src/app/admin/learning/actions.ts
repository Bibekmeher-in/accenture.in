"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"
import { slugify } from "@/lib/utils"

const LessonSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  externalResource: z.string().url().optional().or(z.literal("")),
  order: z.number().int().default(0),
})

const ModuleSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  order: z.number().int().default(0),
  lessons: z.array(LessonSchema).default([]),
})

const ResourceSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  fileUrl: z.string().min(1),
  type: z.string().default("document"), // e.g., pdf, link
})

const LearningSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1).max(100),
  level: z.string().default("Beginner"),
  duration: z.string().default(""),
  instructor: z.string().default(""),
  language: z.string().default("English"),
  thumbnail: z.string().default(""),
  objectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).default([]),
  modules: z.array(ModuleSchema).default([]),
  resources: z.array(ResourceSchema).default([]),
  status: z.enum(["Draft", "Published", "Archived"]).default("Draft"),
  orderRank: z.number().int().default(0),
})

export async function createCourse(data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = LearningSchema.safeParse(data)

    if (!parsed.success) {
      console.error("Validation error:", parsed.error)
      return { error: "Invalid course data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Generate unique slug
    const baseSlug = slugify(parsed.data.title)
    let slug = baseSlug
    let counter = 1
    while (await db.collection("learning").findOne({ slug })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const courseDoc = {
      ...parsed.data,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("learning").insertOne(courseDoc)

    await logAudit({
      actor: session.username,
      action: "LEARNING_COURSE_CREATED",
      entity: "Learning",
      entityId: result.insertedId.toString(),
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/learning")
    revalidatePath("/admin/learning")
    return { success: true, slug }
  } catch (err) {
    console.error("Create course error:", err)
    return { error: "Failed to create course" }
  }
}

export async function updateCourse(id: string, data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = LearningSchema.safeParse(data)

    if (!parsed.success) {
      console.error("Validation error:", parsed.error)
      return { error: "Invalid course data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("learning").updateOne(
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
      action: "LEARNING_COURSE_UPDATED",
      entity: "Learning",
      entityId: id,
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/learning")
    revalidatePath("/admin/learning")
    return { success: true }
  } catch (err) {
    console.error("Update course error:", err)
    return { error: "Failed to update course" }
  }
}

export async function toggleCourseStatus(id: string, newStatus: "Draft" | "Published" | "Archived") {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("learning").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: newStatus, updatedAt: new Date().toISOString() } }
    )

    await logAudit({
      actor: session.username,
      action: "LEARNING_COURSE_STATUS_TOGGLED",
      entity: "Learning",
      entityId: id,
      metadata: { status: newStatus }
    })

    revalidatePath("/learning")
    revalidatePath("/admin/learning")
    return { success: true }
  } catch (err) {
    console.error("Toggle course status error:", err)
    return { error: "Failed to update course status" }
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

    // Check for student enrollments
    const enrollmentCount = await db.collection("enrollments").countDocuments({
      courseId: id,
    })

    if (enrollmentCount > 0) {
      // Safe archive instead of deleting student records
      await db.collection("learning").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "Archived", updatedAt: new Date().toISOString() } }
      )

      await logAudit({
        actor: session.username,
        action: "LEARNING_COURSE_ARCHIVED_SAFE",
        entity: "Learning",
        entityId: id,
        metadata: { title: courseToDelete.title, reason: "Has student enrollments", enrollmentCount }
      })

      revalidatePath("/learning")
      revalidatePath("/admin/learning")
      return {
        success: true,
        archived: true,
        message: `Course has ${enrollmentCount} active student enrollments. To preserve student records and progress, it was moved to Archived status instead of being deleted.`
      }
    }

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
  } catch (err) {
    console.error("Delete course error:", err)
    return { error: "Failed to delete course" }
  }
}

export async function updateEnrollmentStatus(enrollmentId: string, status: "Active" | "Completed" | "Dropped") {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("enrollments").updateOne(
      { _id: new ObjectId(enrollmentId) },
      { $set: { status, updatedAt: new Date().toISOString() } }
    )

    await logAudit({
      actor: session.username,
      action: "ENROLLMENT_STATUS_UPDATED",
      entity: "Enrollment",
      entityId: enrollmentId,
      metadata: { status }
    })

    revalidatePath("/admin/learning")
    return { success: true }
  } catch (err) {
    console.error("Update enrollment status error:", err)
    return { error: "Failed to update enrollment status" }
  }
}

export async function deleteEnrollment(enrollmentId: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("enrollments").deleteOne({ _id: new ObjectId(enrollmentId) })

    await logAudit({
      actor: session.username,
      action: "ENROLLMENT_DELETED",
      entity: "Enrollment",
      entityId: enrollmentId,
    })

    revalidatePath("/admin/learning")
    return { success: true }
  } catch (err) {
    console.error("Delete enrollment error:", err)
    return { error: "Failed to delete enrollment" }
  }
}
