"use client"

import * as React from "react"
import { createPortfolioProject, updatePortfolioProject, deletePortfolioProject } from "./actions"
import { Trash2, Plus, Edit2, Search, FolderGit2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { Project } from "@/data/projects"

export function PortfolioTable({ initialProjects }: { initialProjects: Project[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [showForm, setShowForm] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const filteredProjects = React.useMemo(() => {
    return initialProjects.filter((p) => {
      const q = searchTerm.toLowerCase()
      return (
        p.title.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [initialProjects, searchTerm])

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete project "${title}"?`)) return
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await deletePortfolioProject(id)
      if (res?.error) setError(res.error)
      else {
        setSuccess(`Project "${title}" deleted successfully.`)
        setTimeout(() => setSuccess(null), 3000)
      }
    })
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    startTransition(async () => {
      const result = await createPortfolioProject(data)
      if (result.success) {
        setShowForm(false)
        setSuccess("Project created successfully.")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Failed to create project")
      }
    })
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingProject?._id) return
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    startTransition(async () => {
      const result = await updatePortfolioProject(editingProject._id!, data)
      if (result.success) {
        setEditingProject(null)
        setSuccess("Project updated successfully.")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Failed to update project")
      }
    })
  }

  if (initialProjects.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-card">
        <FolderGit2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold text-foreground">No portfolio projects</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mb-6">
          Showcase your work by creating your first portfolio case study.
        </p>
        <Button onClick={() => setShowForm(true)} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm border border-red-500/20">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-600 p-4 rounded-xl text-sm border border-green-500/20">
          {success}
        </div>
      )}

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects by title, type, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {!showForm && !editingProject && (
          <Button onClick={() => setShowForm(true)} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" /> Add Project
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4 max-w-2xl">
          <h3 className="font-bold text-base">Add New Portfolio Project</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Project Title</label>
              <input required name="title" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Project Type (e.g. Concept Project, Client Case)</label>
              <input required name="type" defaultValue="Sample Project" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1">Tags (comma-separated, e.g. React, Node.js, AWS)</label>
              <input name="tags" placeholder="React, Next.js, PostgreSQL" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1">Image URL (Optional)</label>
              <input name="imageUrl" placeholder="https://... or /image.png" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea required name="description" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>Save Project</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" /> Edit Project: {editingProject.title}
              </h3>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Title</label>
                  <input
                    required
                    name="title"
                    defaultValue={editingProject.title}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Type</label>
                  <input
                    required
                    name="type"
                    defaultValue={editingProject.type}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Tags (comma-separated)</label>
                  <input
                    name="tags"
                    defaultValue={editingProject.tags?.join(", ")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Image URL</label>
                  <input
                    name="imageUrl"
                    defaultValue={editingProject.imageUrl || ""}
                    placeholder="https://... or /image.png"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  required
                  name="description"
                  defaultValue={editingProject.description}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs">
            <tr>
              <th className="px-6 py-3.5 font-semibold">Title</th>
              <th className="px-6 py-3.5 font-semibold">Type</th>
              <th className="px-6 py-3.5 font-semibold">Tags</th>
              <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No projects match your search query.
                </td>
              </tr>
            ) : (
              filteredProjects.map((project, i) => (
                <tr key={project._id || i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{project.title}</div>
                    <div className="text-muted-foreground text-xs truncate max-w-sm">{project.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {project.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {project._id ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProject(project)}
                            disabled={isPending}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                            onClick={() => handleDelete(project._id!, project.title)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Static preset</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
