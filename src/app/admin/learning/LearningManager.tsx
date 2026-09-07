"use client"

import * as React from "react"
import { createCourse, updateCourse, deleteCourse } from "./actions"
import { BookOpen, Plus, Trash2, Search, Filter, PlayCircle, Clock, BookMarked, Eye } from "lucide-react"
import { CourseForm, CourseFormData } from "./CourseForm"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LearningManager({ initialCourses: courses }: { initialCourses: any[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [view, setView] = React.useState<"list" | "form">("list")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingCourse, setEditingCourse] = React.useState<any | null>(null)

  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")

  const categories = Array.from(new Set(courses.map(c => c.category))).filter(Boolean)

  const filteredCourses = courses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && c.category !== categoryFilter) return false
    if (statusFilter && c.status !== statusFilter) return false
    return true
  }).sort((a, b) => b.orderRank - a.orderRank || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === "Published").length,
    draft: courses.filter(c => c.status === "Draft").length,
    categories: categories.length
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenForm = (course?: any) => {
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
        res = await updateCourse(editingCourse._id as string, data as any)
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to completely delete this course? This action cannot be undone.")) {
      startTransition(async () => {
        const res = await deleteCourse(id)
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-border bg-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Learning</h1>
            <p className="text-muted-foreground text-lg">Manage courses, educational resources, and published learning content.</p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:bg-primary/90 hover:shadow transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Course
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 border border-border rounded-xl p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Courses</p>
            <p className="text-3xl font-black">{stats.total}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Published</p>
            <p className="text-3xl font-black text-green-700 dark:text-green-300">{stats.published}</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Drafts</p>
            <p className="text-3xl font-black text-orange-700 dark:text-orange-300">{stats.draft}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Categories</p>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{stats.categories}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              placeholder="Search courses..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative min-w-[160px]">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
              </select>
            </div>
            <div className="relative min-w-[160px]">
              <Eye className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
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
                className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-24 bg-muted/10 border-2 border-dashed border-border rounded-2xl">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-2xl font-bold mb-2">No courses found</h3>
            <p className="text-muted-foreground">Adjust your filters or add a new course to get started.</p>
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
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md shadow-sm backdrop-blur-md ${
                      course.status === "Published" ? 'bg-green-500/90 text-white' : 
                      course.status === "Draft" ? 'bg-orange-500/90 text-white' : 'bg-gray-500/90 text-white'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                      {course.category}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
                      {course.level || "Beginner"}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-4">
                    {course.duration && (
                      <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {course.duration}</span>
                    )}
                    <span className="flex items-center"><BookMarked className="w-3.5 h-3.5 mr-1" /> {course.modules?.length || 0} Modules</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border flex justify-between items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      Rank: {course.orderRank || 0}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenForm(course)}
                        className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-sm rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
