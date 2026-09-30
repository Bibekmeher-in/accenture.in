"use client"

import * as React from "react"
import {
  createPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
  toggleProjectStatus
} from "./actions"
import { Trash2, Plus, Edit2, Search, CheckCircle2, AlertCircle, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { Project } from "@/data/projects"

export function PortfolioTable({ initialProjects }: { initialProjects: Project[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [showForm, setShowForm] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const filteredProjects = React.useMemo(() => {
    return initialProjects.filter((p) => {
      const q = searchTerm.toLowerCase()
      const matchSearch =
        p.title.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      const matchStatus = statusFilter === "all" || (p.status || "Published") === statusFilter
      return matchSearch && matchStatus
    })
  }, [initialProjects, searchTerm, statusFilter])

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
        window.location.reload()
      }
    })
  }

  const handleToggleStatus = (project: Project, newStatus: "Published" | "Draft") => {
    if (!project._id) return
    startTransition(async () => {
      const res = await toggleProjectStatus(project._id!, newStatus)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(`Project status updated to ${newStatus}.`)
        setTimeout(() => setSuccess(null), 3000)
        window.location.reload()
      }
    })
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      title: formData.get("title"),
      type: formData.get("type"),
      tags: formData.get("tags"),
      imageUrl: formData.get("imageUrl"),
      description: formData.get("description"),
      status: formData.get("status") || "Published",
      orderRank: Number(formData.get("orderRank")) || 0,
      featured: formData.get("featured") === "on",
    }

    startTransition(async () => {
      const result = await createPortfolioProject(data)
      if (result.success) {
        setShowForm(false)
        setSuccess("Project created successfully.")
        setTimeout(() => setSuccess(null), 3000)
        window.location.reload()
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
    const data: Record<string, unknown> = {
      title: formData.get("title"),
      type: formData.get("type"),
      tags: formData.get("tags"),
      imageUrl: formData.get("imageUrl"),
      description: formData.get("description"),
      status: formData.get("status") || "Published",
      orderRank: Number(formData.get("orderRank")) || 0,
      featured: formData.get("featured") === "on",
    }

    startTransition(async () => {
      const result = await updatePortfolioProject(editingProject._id!, data)
      if (result.success) {
        setEditingProject(null)
        setSuccess("Project updated successfully.")
        setTimeout(() => setSuccess(null), 3000)
        window.location.reload()
      } else {
        setError(result.error || "Failed to update project")
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-xl text-sm border border-emerald-500/20 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter projects by status"
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {!showForm && !editingProject && (
          <Button onClick={() => setShowForm(true)} disabled={isPending}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Project
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-base">Add New Portfolio Project</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Project Title *</label>
              <input required name="title" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Project Type (e.g. Concept Project, Client Case) *</label>
              <input required name="type" defaultValue="Client Case" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Status</label>
              <select name="status" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm">
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Display Order</label>
              <input type="number" name="orderRank" defaultValue={initialProjects.length + 1} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono" />
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
            <label className="block text-xs font-semibold mb-1">Description *</label>
            <textarea required name="description" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" name="featured" className="rounded text-primary focus:ring-primary" />
            <label htmlFor="featured" className="text-xs font-semibold cursor-pointer">Featured on Home Page showcase</label>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
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
              <button onClick={() => setEditingProject(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Title *</label>
                  <input
                    required
                    name="title"
                    defaultValue={editingProject.title}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Type *</label>
                  <input
                    required
                    name="type"
                    defaultValue={editingProject.type}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingProject.status || "Published"}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    name="orderRank"
                    defaultValue={editingProject.orderRank || 0}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
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
                <label className="block text-xs font-semibold mb-1">Description *</label>
                <textarea
                  required
                  name="description"
                  defaultValue={editingProject.description}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editFeatured"
                  name="featured"
                  defaultChecked={editingProject.featured}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="editFeatured" className="text-xs font-semibold cursor-pointer">Featured on Home Page</label>
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
        <table className="w-full text-sm text-left border-collapse min-w-[750px]">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs">
            <tr>
              <th className="px-6 py-3.5 font-semibold">Title</th>
              <th className="px-6 py-3.5 font-semibold">Type</th>
              <th className="px-6 py-3.5 font-semibold">Tags</th>
              <th className="px-6 py-3.5 font-semibold">Status</th>
              <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No projects match your search query.
                </td>
              </tr>
            ) : (
              filteredProjects.map((project, i) => (
                <tr key={project._id || i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{project.title}</span>
                      {project.featured && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary border border-primary/20">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs truncate max-w-sm">{project.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-muted text-foreground">
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
                  <td className="px-6 py-4">
                    {project._id ? (
                      <button
                        onClick={() => handleToggleStatus(project, (project.status || "Published") === "Published" ? "Draft" : "Published")}
                        disabled={isPending}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border cursor-pointer ${
                          (project.status || "Published") === "Published"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {project.status || "Published"}
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                        Preset
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <a
                        href="/portfolio/"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="View on Portfolio"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {project._id && (
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
