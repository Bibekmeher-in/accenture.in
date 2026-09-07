import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { LearningHub } from "./LearningHub"

export const metadata: Metadata = {
  title: "Learning",
  description: "Build practical skills with structured learning resources and courses.",
}

export default async function LearningPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const coursesRaw = await db
    .collection("learning")
    .find({ status: "Published" })
    .toArray()

  // Convert ObjectIds to strings to pass to client component
  const courses = coursesRaw.map(course => ({
    ...course,
    _id: course._id.toString()
  }))

  return <LearningHub initialCourses={courses} />
}
