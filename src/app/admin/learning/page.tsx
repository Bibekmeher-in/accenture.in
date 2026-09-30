import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { LearningManager } from "./LearningManager"

export const metadata: Metadata = {
  title: "Learning Management | Admin",
}

export default async function AdminLearningPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const [coursesRaw, enrollmentsRaw] = await Promise.all([
    db.collection("learning").find({}).sort({ orderRank: -1, createdAt: -1 }).toArray(),
    db.collection("enrollments").find({}).sort({ enrolledAt: -1 }).toArray(),
  ])

  const courses = coursesRaw.map(course => ({
    _id: course._id.toString(),
    title: course.title || "",
    slug: course.slug || "",
    description: course.description || "",
    category: course.category || "General",
    level: course.level || "Beginner",
    duration: course.duration || "",
    instructor: course.instructor || "",
    language: course.language || "English",
    thumbnail: course.thumbnail || "",
    objectives: course.objectives || [],
    requirements: course.requirements || [],
    targetAudience: course.targetAudience || [],
    modules: course.modules || [],
    resources: course.resources || [],
    status: course.status || "Draft",
    orderRank: course.orderRank || 0,
    createdAt: course.createdAt || new Date().toISOString(),
  }))

  const enrollments = enrollmentsRaw.map(e => ({
    _id: e._id.toString(),
    customerId: e.customerId || "",
    customerEmail: e.customerEmail || "",
    customerName: e.customerName || "Student",
    courseId: e.courseId || "",
    courseSlug: e.courseSlug || "",
    courseTitle: e.courseTitle || "",
    status: e.status || "Active",
    progress: e.progress || 0,
    enrolledAt: e.enrolledAt || new Date().toISOString(),
  }))

  return (
    <div className="space-y-6">
      <LearningManager initialCourses={courses} initialEnrollments={enrollments} />
    </div>
  )
}
