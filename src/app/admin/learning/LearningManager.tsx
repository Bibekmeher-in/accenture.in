"use client"

import * as React from "react"
import { createCourse, updateCourse, deleteCourse } from "./actions"
import { BookOpen, Plus, Edit, Trash2, X } from "lucide-react"

export type Course = {
  _id: string
  title: string
  description: string
  category: string
  isPublished: boolean
  order: number
}

export function LearningManager({ initialCourses: courses }: { initialCourses: Course[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null)

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    category: "",
    isPublished: false,
    order: 0
  })

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        isPublished: course.isPublished,
        order: course.order
      })
    } else {
      setEditingCourse(null)
      setFormData({
        title: "",
        description: "",
        category: "",
        isPublished: false,
        order: 0
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const payload = {
        ...formData,
        isPublished: formData.isPublished
      }

      let res
      if (editingCourse) {
        res = await updateCourse(editingCourse._id, payload)
      } else {
        res = await createCourse(payload)
      }

      if (res.error) {
        alert(res.error)
      } else {
        setIsModalOpen(false)
        window.location.reload()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
        <h2 className="text-lg font-semibold flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-primary" /> Learning Resources
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Course
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {courses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No learning resources found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course._id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight">{course.title}</h3>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handleOpenModal(course)} className="p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(course._id)} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">{course.category}</p>
                <p className="text-sm text-muted-foreground flex-1 line-clamp-3 mb-4">{course.description}</p>

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${course.isPublished ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                  <span className="text-xs text-muted-foreground">Order: {course.order}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingCourse ? "Edit Course" : "Add Course"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g. Technology, Business"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Rank</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={e => setFormData({...formData, isPublished: e.target.checked})}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                />
                <label htmlFor="isPublished" className="text-sm font-medium cursor-pointer">
                  Publish to live site
                </label>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
