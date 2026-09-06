import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { LearningManager } from "./LearningManager"

export const metadata: Metadata = {
  title: "Learning Management | Admin",
}

export default async function AdminLearningPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const coursesRaw = await db
    .collection("learning")
    .find({})
    .sort({ order: 1, createdAt: -1 })
    .toArray()

  const courses = coursesRaw.map(course => ({
    _id: course._id.toString(),
    title: course.title,
    description: course.description,
    category: course.category,
    isPublished: course.isPublished,
    order: course.order,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Learning</h1>
          <p className="text-muted-foreground mt-2">Manage courses and learning resources.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-[70vh]">
        <LearningManager initialCourses={courses} />
      </div>
    </div>
  )
}
