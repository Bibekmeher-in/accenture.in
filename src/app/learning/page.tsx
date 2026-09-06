import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { BookOpen, BookText } from "lucide-react"
import clientPromise from "@/lib/mongodb"

export const metadata: Metadata = {
  title: "Learning",
  description: "Professional learning and educational resources.",
}

export default async function LearningPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const coursesRaw = await db
    .collection("learning")
    .find({ isPublished: true })
    .sort({ order: 1, createdAt: -1 })
    .toArray()

  if (coursesRaw.length === 0) {
    return (
      <div className="flex flex-col min-h-[60vh] py-16 md:py-24">
        <Container>
          <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto">
            <div className="bg-primary/10 p-4 rounded-full">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Learning Resources</h1>
            <p className="text-xl text-muted-foreground">
              Learning resources are coming soon. Check back later for courses, tutorials, and guides.
            </p>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="py-16 md:py-24 bg-background min-h-[60vh]">
      <Container>
        <div className="mb-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Learning Resources</h1>
          <p className="text-xl text-muted-foreground">
            Explore our curated selection of professional courses, tutorials, and technical guides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coursesRaw.map(course => (
            <div key={course._id.toString()} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="bg-primary/5 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <BookText className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                {course.category}
              </span>
              <h3 className="text-xl font-bold mb-3">{course.title}</h3>
              <p className="text-muted-foreground flex-1 mb-6">
                {course.description}
              </p>
              <button className="self-start text-sm font-semibold flex items-center text-primary hover:underline">
                Start Learning &rarr;
              </button>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
