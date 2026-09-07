import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { LearningHub } from "./LearningHub"

export const metadata: Metadata = {
  title: "Learning",
  description: "Build practical skills with structured learning resources and courses.",
}

export const dynamic = "force-dynamic"

export default async function LearningPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let courses: any[] = []

  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const coursesRaw = await db
      .collection("learning")
      .find({ status: "Published" })
      .toArray()

    // Convert ObjectIds to strings to pass to client component
    courses = coursesRaw.map(course => ({
      ...course,
      _id: course._id.toString()
    }))
  } catch (error) {
    console.error("Failed to load courses from database:", error)
  }

  return <LearningHub initialCourses={courses} />
}
