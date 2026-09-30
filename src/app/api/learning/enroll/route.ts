import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getCustomerSession } from "@/lib/customer-auth"
import { z } from "zod"

const EnrollSchema = z.object({
  courseSlug: z.string().min(1),
})

export async function GET(req: Request) {
  try {
    const session = await getCustomerSession()
    if (!session) {
      return NextResponse.json({ enrolled: false, authenticated: false })
    }

    const { searchParams } = new URL(req.url)
    const courseSlug = searchParams.get("courseSlug")

    if (!courseSlug) {
      return NextResponse.json({ error: "Missing courseSlug" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const course = await db.collection("learning").findOne({ slug: courseSlug })
    if (!course) {
      return NextResponse.json({ enrolled: false, error: "Course not found" })
    }

    const enrollment = await db.collection("enrollments").findOne({
      customerId: session.customerId,
      courseId: course._id.toString(),
    })

    return NextResponse.json({
      enrolled: !!enrollment,
      enrollment: enrollment ? {
        id: enrollment._id.toString(),
        status: enrollment.status,
        progress: enrollment.progress || 0,
        enrolledAt: enrollment.enrolledAt,
      } : null,
      authenticated: true,
    })
  } catch (error) {
    console.error("Enrollment check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCustomerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to enroll." }, { status: 401 })
    }

    const body = await req.json()
    const parsed = EnrollSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const course = await db.collection("learning").findOne({ slug: parsed.data.courseSlug, status: "Published" })
    if (!course) {
      return NextResponse.json({ error: "Course not found or not published" }, { status: 404 })
    }

    const courseIdStr = course._id.toString()

    // Upsert enrollment
    const existing = await db.collection("enrollments").findOne({
      customerId: session.customerId,
      courseId: courseIdStr,
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already enrolled",
        enrollmentId: existing._id.toString(),
      })
    }

    const newEnrollment = {
      customerId: session.customerId,
      customerEmail: session.email,
      customerName: session.name || "Student",
      courseId: courseIdStr,
      courseSlug: course.slug,
      courseTitle: course.title,
      status: "Active",
      progress: 0,
      enrolledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("enrollments").insertOne(newEnrollment)

    return NextResponse.json({
      success: true,
      message: "Successfully enrolled in course",
      enrollmentId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Enrollment creation error:", error)
    return NextResponse.json({ error: "Failed to enroll in course" }, { status: 500 })
  }
}
