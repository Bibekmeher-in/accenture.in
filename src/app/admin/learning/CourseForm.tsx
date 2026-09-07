"use client"

import React, { useState } from "react"
import { Upload, X, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, FileText, PlayCircle, Link as LinkIcon, AlertCircle } from "lucide-react"

export type LessonData = {
  id: string
  title: string
  content: string
  videoUrl: string
  externalResource: string
  order: number
}

export type ModuleData = {
  id: string
  title: string
  order: number
  lessons: LessonData[]
}

export type ResourceData = {
  id: string
  title: string
  fileUrl: string
  type: string
}

export type CourseFormData = {
  title: string
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
  modules: ModuleData[]
  resources: ResourceData[]
  status: "Draft" | "Published" | "Archived"
  orderRank: number
}

type Props = {
  initialData?: Partial<CourseFormData>
  onSubmit: (data: CourseFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function CourseForm({ initialData, onSubmit, onCancel, isSubmitting }: Props) {
  const [activeTab, setActiveTab] = useState<"basic" | "curriculum" | "resources" | "settings">("basic")
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    level: initialData?.level || "Beginner",
    duration: initialData?.duration || "",
    instructor: initialData?.instructor || "",
    language: initialData?.language || "English",
    thumbnail: initialData?.thumbnail || "",
    objectives: initialData?.objectives || [],
    requirements: initialData?.requirements || [],
    targetAudience: initialData?.targetAudience || [],
    modules: initialData?.modules || [],
    resources: initialData?.resources || [],
    status: initialData?.status || "Draft",
    orderRank: initialData?.orderRank || 0,
  })

  const [isUploading, setIsUploading] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("folder", "learning")

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form
      })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      
      return data.url
    } catch (err) {
      alert("Upload failed: " + (err as Error).message)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await handleUpload(file)
    if (url) {
      setFormData(prev => ({ ...prev, thumbnail: url }))
    }
  }

  const handleArrayChange = (field: "objectives" | "requirements" | "targetAudience", index: number, value: string) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({ ...formData, [field]: newArray })
  }

  const addArrayItem = (field: "objectives" | "requirements" | "targetAudience") => {
    setFormData({ ...formData, [field]: [...formData[field], ""] })
  }

  const removeArrayItem = (field: "objectives" | "requirements" | "targetAudience", index: number) => {
    const newArray = [...formData[field]]
    newArray.splice(index, 1)
    setFormData({ ...formData, [field]: newArray })
  }

  const addModule = () => {
    const newModule: ModuleData = {
      id: Math.random().toString(36).substring(7),
      title: "New Module",
      order: formData.modules.length,
      lessons: []
    }
    setFormData({ ...formData, modules: [...formData.modules, newModule] })
    setExpandedModules({ ...expandedModules, [newModule.id]: true })
  }

  const updateModule = (modId: string, title: string) => {
    setFormData({
      ...formData,
      modules: formData.modules.map(m => m.id === modId ? { ...m, title } : m)
    })
  }

  const deleteModule = (modId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return
    setFormData({
      ...formData,
      modules: formData.modules.filter(m => m.id !== modId)
    })
  }

  const addLesson = (modId: string) => {
    setFormData({
      ...formData,
      modules: formData.modules.map(m => {
        if (m.id === modId) {
          return {
            ...m,
            lessons: [...m.lessons, {
              id: Math.random().toString(36).substring(7),
              title: "New Lesson",
              content: "",
              videoUrl: "",
              externalResource: "",
              order: m.lessons.length
            }]
          }
        }
        return m
      })
    })
  }

  const updateLesson = (modId: string, lessonId: string, field: keyof LessonData, value: string | number) => {
    setFormData({
      ...formData,
      modules: formData.modules.map(m => {
        if (m.id === modId) {
          return {
            ...m,
            lessons: m.lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l)
          }
        }
        return m
      })
    })
  }

  const deleteLesson = (modId: string, lessonId: string) => {
    setFormData({
      ...formData,
      modules: formData.modules.map(m => {
        if (m.id === modId) {
          return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
        }
        return m
      })
    })
  }

  const addResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await handleUpload(file)
    if (url) {
      setFormData({
        ...formData,
        resources: [...formData.resources, {
          id: Math.random().toString(36).substring(7),
          title: file.name,
          fileUrl: url,
          type: file.type.includes("pdf") ? "pdf" : "document"
        }]
      })
    }
  }

  const removeResource = (resId: string) => {
    setFormData({
      ...formData,
      resources: formData.resources.filter(r => r.id !== resId)
    })
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10">
        <h2 className="text-xl font-bold">Course Editor</h2>
        <button onClick={onCancel} className="p-2 hover:bg-muted rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-border bg-muted/5">
        {[
          { id: "basic", label: "Basic Info" },
          { id: "curriculum", label: "Curriculum" },
          { id: "resources", label: "Resources" },
          { id: "settings", label: "Settings" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "basic" | "curriculum" | "resources" | "settings")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "basic" && (
          <div className="space-y-6 max-w-3xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course Title *</label>
              <input 
                required 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2" 
                placeholder="e.g. Advanced React Patterns"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <textarea 
                required rows={4}
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 resize-y" 
                placeholder="Comprehensive course description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <input 
                  required 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2" 
                  placeholder="e.g. Web Development"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <select 
                  value={formData.level} 
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <input 
                  value={formData.duration} 
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2" 
                  placeholder="e.g. 8 hours"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Instructor</label>
                <input 
                  value={formData.instructor} 
                  onChange={e => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2" 
                  placeholder="Instructor Name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course Thumbnail</label>
              <div className="flex items-center gap-4">
                {formData.thumbnail && (
                  <div className="w-32 h-24 bg-muted rounded-lg border border-border overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFormData({ ...formData, thumbnail: "" })}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg flex flex-col items-center justify-center p-6 flex-1 text-muted-foreground hover:bg-muted/10 h-24">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleThumbnailUpload} 
                    disabled={isUploading}
                  />
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm">{isUploading ? "Uploading..." : "Click to upload image"}</span>
                </label>
              </div>
            </div>

            {/* Arrays for Objectives, Requirements, Target Audience */}
            {(["objectives", "requirements", "targetAudience"] as const).map(field => (
              <div key={field} className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <button type="button" onClick={() => addArrayItem(field)} className="text-xs text-primary font-medium hover:underline flex items-center">
                    <Plus className="w-3 h-3 mr-1" /> Add {field === "targetAudience" ? "Audience" : "Item"}
                  </button>
                </div>
                {formData[field].length === 0 && <p className="text-xs text-muted-foreground italic">No items added.</p>}
                {formData[field].map((val, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={val}
                      onChange={e => handleArrayChange(field, idx, e.target.value)}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm"
                      placeholder={`Add ${field}...`}
                    />
                    <button type="button" onClick={() => removeArrayItem(field, idx)} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === "curriculum" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Build your course structure by adding modules and lessons.</p>
              <button type="button" onClick={addModule} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium flex items-center">
                <Plus className="w-4 h-4 mr-2" /> Add Module
              </button>
            </div>

            {formData.modules.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No modules yet. Start building your curriculum!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.modules.map((module, mIndex) => (
                  <div key={module.id} className="border border-border rounded-xl bg-card overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-muted/20 border-b border-border">
                      <button 
                        onClick={() => setExpandedModules(prev => ({ ...prev, [module.id]: !prev[module.id] }))}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {expandedModules[module.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                      <span className="text-sm font-bold text-muted-foreground">Module {mIndex + 1}</span>
                      <input 
                        value={module.title}
                        onChange={e => updateModule(module.id, e.target.value)}
                        className="flex-1 bg-transparent border-none font-bold focus:ring-0 px-0"
                        placeholder="Module Title"
                      />
                      <button type="button" onClick={() => deleteModule(module.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {expandedModules[module.id] && (
                      <div className="p-4 space-y-4 bg-background">
                        {module.lessons.map((lesson, lIndex) => (
                          <div key={lesson.id} className="flex flex-col gap-3 p-4 border border-border rounded-lg bg-muted/5">
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                              <span className="text-sm font-bold text-muted-foreground">Lesson {lIndex + 1}</span>
                              <input 
                                value={lesson.title}
                                onChange={e => updateLesson(module.id, lesson.id, "title", e.target.value)}
                                className="flex-1 bg-background border border-border rounded md px-3 py-1.5 text-sm"
                                placeholder="Lesson Title"
                              />
                              <button type="button" onClick={() => deleteLesson(module.id, lesson.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="pl-7 space-y-3">
                              <div>
                                <label className="text-xs text-muted-foreground font-medium flex items-center mb-1"><FileText className="w-3 h-3 mr-1" /> Content</label>
                                <textarea 
                                  rows={2}
                                  value={lesson.content}
                                  onChange={e => updateLesson(module.id, lesson.id, "content", e.target.value)}
                                  className="w-full bg-background border border-border rounded md px-3 py-1.5 text-sm resize-y"
                                  placeholder="Lesson content or description..."
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs text-muted-foreground font-medium flex items-center mb-1"><PlayCircle className="w-3 h-3 mr-1" /> Video URL</label>
                                  <input 
                                    value={lesson.videoUrl}
                                    onChange={e => updateLesson(module.id, lesson.id, "videoUrl", e.target.value)}
                                    className="w-full bg-background border border-border rounded md px-3 py-1 text-sm"
                                    placeholder="https://..."
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground font-medium flex items-center mb-1"><LinkIcon className="w-3 h-3 mr-1" /> External Link</label>
                                  <input 
                                    value={lesson.externalResource}
                                    onChange={e => updateLesson(module.id, lesson.id, "externalResource", e.target.value)}
                                    className="w-full bg-background border border-border rounded md px-3 py-1 text-sm"
                                    placeholder="https://..."
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => addLesson(module.id)} className="text-sm text-primary font-medium hover:underline flex items-center ml-2">
                          <Plus className="w-3 h-3 mr-1" /> Add Lesson
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "resources" && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Upload PDFs, documents, or links for students to download.</p>
              <label className="cursor-pointer px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium flex items-center">
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  className="hidden" 
                  onChange={addResource}
                  disabled={isUploading}
                />
                <Upload className="w-4 h-4 mr-2" /> {isUploading ? "Uploading..." : "Upload File"}
              </label>
            </div>

            {formData.resources.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No resources uploaded yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {formData.resources.map(resource => (
                  <div key={resource.id} className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{resource.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{resource.fileUrl}</p>
                    </div>
                    <button type="button" onClick={() => removeResource(resource.id)} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 max-w-3xl">
            <div className="p-4 border border-border rounded-xl bg-card space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Publication Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({ ...formData, status: e.target.value as "Draft" | "Published" | "Archived" })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2"
                >
                  <option value="Draft">Draft (Hidden from public)</option>
                  <option value="Published">Published (Visible on site)</option>
                  <option value="Archived">Archived</option>
                </select>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" /> Published courses are immediately visible to users.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <label className="text-sm font-medium">Display Order Rank</label>
                <input 
                  type="number"
                  value={formData.orderRank} 
                  onChange={e => setFormData({ ...formData, orderRank: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2"
                />
                <p className="text-xs text-muted-foreground">Higher numbers appear first in recommended sorting.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 bg-muted/10 flex justify-end gap-3">
        <button 
          onClick={onCancel}
          disabled={isSubmitting || isUploading}
          className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSubmit(formData)}
          disabled={isSubmitting || isUploading || !formData.title || !formData.category}
          className="px-6 py-2.5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Course"}
        </button>
      </div>
    </div>
  )
}
