import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { notFound } from "next/navigation"
import clientPromise from "@/lib/mongodb"
import { Clock, BookOpen, User, CheckCircle2, Target, Users, AlertCircle, FileText, Download } from "lucide-react"
import Link from "next/link"
import { CourseCurriculum } from "./CourseCurriculum"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const client = await clientPromise
    const db = client.db("accenture")
    const course = await db.collection("learning").findOne({ slug, status: "Published" })

    if (!course) {
      return { title: "Course Not Found" }
    }

    return {
      title: course.title,
      description: course.description?.substring(0, 160),
    }
  } catch {
    return { title: "Course | TEKNIXX Learning" }
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let course: any = null

  try {
    const client = await clientPromise
    const db = client.db("accenture")
    course = await db.collection("learning").findOne({ slug, status: "Published" })
  } catch (error) {
    console.error("Failed to fetch course:", error)
  }

  if (!course) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Course Header */}
      <div className="bg-muted/10 border-b border-border py-12 md:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-primary/10 text-primary rounded-lg">
                  {course.category}
                </span>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-muted text-muted-foreground rounded-lg">
                  {course.level || "Beginner"}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                {course.title}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4 text-sm font-semibold text-muted-foreground">
                {course.instructor && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span>{course.instructor}</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" /> {course.duration}
                  </div>
                )}
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" /> {course.language || "English"}
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 hover:shadow-lg transition-all text-center">
                  Start Learning
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-video bg-muted rounded-2xl overflow-hidden border border-border shadow-xl relative">
                {course.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground">
                    <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                    <span className="font-medium text-sm">TEKNIXX ACADEMY</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Course Content */}
      <Container className="py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-16">
            
            {/* Overview Section */}
            <section>
              <h2 className="text-3xl font-bold mb-8">Course Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {course.objectives && course.objectives.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                    <h3 className="text-lg font-bold flex items-center mb-6">
                      <Target className="w-5 h-5 mr-2 text-primary" /> What you&apos;ll learn
                    </h3>
                    <ul className="space-y-4">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {course.objectives.map((obj: any, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground text-sm leading-relaxed">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-8">
                  {course.requirements && course.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold flex items-center mb-4">
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-500" /> Requirements
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {course.requirements.map((req: any, i: number) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.targetAudience && course.targetAudience.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold flex items-center mb-4">
                        <Users className="w-5 h-5 mr-2 text-blue-500" /> Who is this for?
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {course.targetAudience.map((aud: any, i: number) => (
                          <li key={i}>{aud}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Curriculum Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Curriculum</h2>
                <div className="text-sm font-semibold text-muted-foreground bg-muted px-4 py-2 rounded-full">
                  {course.modules?.length || 0} Modules
                </div>
              </div>
              <CourseCurriculum modules={course.modules || []} />
            </section>

          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              
              {/* Enrollment Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-xl mb-4">Ready to begin?</h3>
                <p className="text-muted-foreground text-sm mb-6">Enroll now to track your progress, access all materials, and earn your certificate.</p>
                <button className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors">
                  Start Course Now
                </button>
              </div>

              {/* Resources */}
              {course.resources && course.resources.length > 0 && (
                <div className="bg-muted/10 border border-border rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" /> Downloadable Resources
                  </h3>
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {course.resources.map((res: any) => (
                      <Link 
                        key={res.id} 
                        href={res.fileUrl} 
                        target="_blank"
                        className="flex items-center justify-between p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors group"
                      >
                        <div className="flex items-center min-w-0">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{res.title}</span>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
