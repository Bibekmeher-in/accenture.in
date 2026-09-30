"use client"

import * as React from "react"
import { createCourse, updateCourse, deleteCourse, toggleCourseStatus, updateEnrollmentStatus, deleteEnrollment } from "./actions"
import { BookOpen, Plus, Trash2, Search, Filter, PlayCircle, Clock, BookMarked, Eye, Users, ExternalLink } from "lucide-react"
import { CourseForm, CourseFormData } from "./CourseForm"
import Link from "next/link"

interface Course {
  _id: string
  title: string
  slug: string
  description: string
  category: string
  level: string
  duration: string
  instructor: string
  language: string
  thumbnail: string
  objectives: string[]
  requirements: string[]
  targetAudience: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modules: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resources: any[]
  status: "Draft" | "Published" | "Archived"
  orderRank: number
  createdAt: string
}

interface Enrollment {
  _id: string
  customerId: string
  customerEmail: string
  customerName: string
  courseId: string
  courseSlug: string
  courseTitle: string
  status: "Active" | "Completed" | "Dropped"
  progress: number
  enrolledAt: string
}

export function LearningManager({
  initialCourses = [],
  initialEnrollments = [],
}: {
  initialCourses: Course[]
  initialEnrollments: Enrollment[]
}) {
  const [isPending, startTransition] = React.useTransition()
  const [activeTab, setActiveTab] = React.useState<"courses" | "enrollments">("courses")
  const [view, setView] = React.useState<"list" | "form">("list")
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null)

  // Course filters
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")

  // Enrollment filters
  const [enrollmentSearch, setEnrollmentSearch] = React.useState("")
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = React.useState("")

  const categories = Array.from(new Set(initialCourses.map(c => c.category))).filter(Boolean)

  const filteredCourses = initialCourses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && c.category !== categoryFilter) return false
    if (statusFilter && c.status !== statusFilter) return false
    return true
  }).sort((a, b) => b.orderRank - a.orderRank || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filteredEnrollments = initialEnrollments.filter(e => {
    if (enrollmentSearch) {
      const q = enrollmentSearch.toLowerCase()
      const matchEmail = e.customerEmail.toLowerCase().includes(q)
      const matchName = e.customerName.toLowerCase().includes(q)
      const matchCourse = e.courseTitle.toLowerCase().includes(q)
      if (!matchEmail && !matchName && !matchCourse) return false
    }
    if (enrollmentStatusFilter && e.status !== enrollmentStatusFilter) return false
    return true
  })

  const stats = {
    totalCourses: initialCourses.length,
    publishedCourses: initialCourses.filter(c => c.status === "Published").length,
    totalEnrollments: initialEnrollments.length,
    activeEnrollments: initialEnrollments.filter(e => e.status === "Active").length,
  }

  const handleOpenForm = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
    } else {
      setEditingCourse(null)
    }
    setView("form")
  }

  const handleSubmit = (data: CourseFormData) => {
    startTransition(async () => {
      let res
      if (editingCourse) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res = await updateCourse(editingCourse._id, data as any)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res = await createCourse(data as any)
      }

      if (res.error) {
        alert(res.error)
      } else {
        setView("list")
        window.location.reload()
      }
    })
  }

  const handleDeleteCourse = (id: string) => {
    if (confirm("Are you sure you want to delete this course? If students are enrolled, it will be safely archived to protect enrollment history.")) {
      startTransition(async () => {
        const res = await deleteCourse(id)
        if (res.error) {
          alert(res.error)
        } else {
          if (res.archived && res.message) {
            alert(res.message)
          }
          window.location.reload()
        }
      })
    }
  }

  const handleToggleCourseStatus = (id: string, newStatus: "Draft" | "Published" | "Archived") => {
    startTransition(async () => {
      const res = await toggleCourseStatus(id, newStatus)
      if (res.error) {
        alert(res.error)
      } else {
        window.location.reload()
      }
    })
  }

  const handleUpdateEnrollmentStatus = (id: string, newStatus: "Active" | "Completed" | "Dropped") => {
    startTransition(async () => {
      const res = await updateEnrollmentStatus(id, newStatus)
      if (res.error) {
        alert(res.error)
      } else {
        window.location.reload()
      }
    })
  }

  const handleDeleteEnrollment = (id: string) => {
    if (confirm("Are you sure you want to remove this student enrollment?")) {
      startTransition(async () => {
        const res = await deleteEnrollment(id)
        if (res.error) {
          alert(res.error)
        } else {
          window.location.reload()
        }
      })
    }
  }

  if (view === "form") {
    return (
      <div className="h-full p-4 md:p-8 bg-muted/10 overflow-y-auto">
        <div className="max-w-5xl mx-auto h-full min-h-[80vh]">
          <CourseForm
            initialData={editingCourse || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setView("list")}
            isSubmitting={isPending}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-border bg-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Learning & Academy</h1>
            <p className="text-muted-foreground text-sm">Manage curriculum, courses, learning content, and student enrollments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all text-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Course
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/30 border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Courses</p>
            <p className="text-2xl font-black">{stats.totalCourses}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Published</p>
            <p className="text-2xl font-black text-green-700 dark:text-green-300">{stats.publishedCourses}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Total Enrollments</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{stats.totalEnrollments}</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Active Students</p>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{stats.activeEnrollments}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border -mb-6 md:-mb-8 pt-2 gap-4">
          <button
            onClick={() => setActiveTab("courses")}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "courses"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Courses ({initialCourses.length})
          </button>
          <button
            onClick={() => setActiveTab("enrollments")}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "enrollments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" /> Enrollments ({initialEnrollments.length})
          </button>
        </div>
      </div>

      {activeTab === "courses" ? (
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative min-w-[140px]">
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                </select>
              </div>
              <div className="relative min-w-[140px]">
                <Eye className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              {(search || categoryFilter || statusFilter) && (
                <button
                  onClick={() => { setSearch(""); setCategoryFilter(""); setStatusFilter("") }}
                  className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Course Grid */}
          {filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border rounded-2xl">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="text-lg font-bold mb-1">No courses found</h3>
              <p className="text-muted-foreground text-sm">Adjust your filters or add a new course to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <div key={course._id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                  <div className="aspect-video bg-muted relative border-b border-border">
                    {course.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted/50">
                        <PlayCircle className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <select
                        value={course.status}
                        onChange={(e) => handleToggleCourseStatus(course._id, e.target.value as "Draft" | "Published" | "Archived")}
                        disabled={isPending}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border-0 shadow cursor-pointer focus:ring-2 focus:ring-primary/50 outline-none backdrop-blur-md ${
                          course.status === "Published"
                            ? "bg-green-500/90 text-white"
                            : course.status === "Draft"
                            ? "bg-amber-500/90 text-white"
                            : "bg-zinc-600/90 text-white"
                        }`}
                      >
                        <option value="Published" className="text-black bg-white">Published</option>
                        <option value="Draft" className="text-black bg-white">Draft</option>
                        <option value="Archived" className="text-black bg-white">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {course.category}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {course.level || "Beginner"}
                      </span>
                    </div>

                    <h3 className="font-bold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>

                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-4">
                      {course.duration && (
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {course.duration}</span>
                      )}
                      <span className="flex items-center"><BookMarked className="w-3.5 h-3.5 mr-1" /> {course.modules?.length || 0} Modules</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-border flex justify-between items-center gap-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Link
                          href={`/learning/${course.slug || course._id}`}
                          target="_blank"
                          className="hover:text-primary flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View
                        </Link>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenForm(course)}
                          className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Enrollments Tab */
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Enrollment Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search enrollments by student name, email, or course..."
                value={enrollmentSearch}
                onChange={e => setEnrollmentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative min-w-[140px]">
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={enrollmentStatusFilter}
                  onChange={e => setEnrollmentStatusFilter(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Dropped">Dropped</option>
                </select>
              </div>
              {(enrollmentSearch || enrollmentStatusFilter) && (
                <button
                  onClick={() => { setEnrollmentSearch(""); setEnrollmentStatusFilter("") }}
                  className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border rounded-2xl">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="text-lg font-bold mb-1">No student enrollments found</h3>
              <p className="text-muted-foreground text-sm">When customers enroll in academy courses, their records will appear here.</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4">Student</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Enrolled Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEnrollments.map(enr => (
                    <tr key={enr._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground">{enr.customerName}</div>
                        <div className="text-xs text-muted-foreground">{enr.customerEmail}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground">{enr.courseTitle}</div>
                        <div className="text-xs text-muted-foreground">{enr.courseSlug}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={enr.status}
                          onChange={(e) => handleUpdateEnrollmentStatus(enr._id, e.target.value as "Active" | "Completed" | "Dropped")}
                          disabled={isPending}
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border-0 cursor-pointer focus:ring-2 focus:ring-primary/50 outline-none ${
                            enr.status === "Completed"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : enr.status === "Active"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Dropped">Dropped</option>
                        </select>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(enr.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteEnrollment(enr._id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors inline-flex"
                          title="Remove Enrollment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
