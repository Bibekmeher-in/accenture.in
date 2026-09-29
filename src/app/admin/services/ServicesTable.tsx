"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/Button"
import { Trash2, LayoutTemplate, Plus, Edit2, Search } from "lucide-react"
import { createService, updateService, deleteService } from "./actions"

interface Service {
  _id: string
  title: string
  slug: string
  description: string
  icon?: string
  createdAt: string
}

export function ServicesTable({ services }: { services: Service[] }) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchTerm.toLowerCase()
      return s.title.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    })
  }, [services, searchTerm])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading("create")
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    const res = await createService(data)
    if (res.error) {
      setError(res.error)
    } else {
      setIsCreating(false)
      setSuccess("Service created successfully.")
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(null)
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingService) return
    setLoading("update")
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    const res = await updateService(editingService._id, data)
    if (res.error) {
      setError(res.error)
    } else {
      setEditingService(null)
      setSuccess("Service updated successfully.")
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(null)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete service "${title}"?`)) return
    setLoading(id)
    setError(null)
    setSuccess(null)
    const res = await deleteService(id)
    if (res?.error) setError(res.error)
    else {
      setSuccess(`Service "${title}" deleted.`)
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(null)
  }

  if (services.length === 0 && !isCreating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-card">
        <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold text-foreground">No services found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mb-6">
          Get started by adding the first service offering to your website.
        </p>
        <Button onClick={() => setIsCreating(true)} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
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
            placeholder="Search services by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {!isCreating && !editingService && (
          <Button onClick={() => setIsCreating(true)} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold mb-4 text-base">Create New Service</h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Slug (URL identifier)</label>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  placeholder="e.g. web-development"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Icon Name (Lucide React)</label>
              <input
                name="icon"
                placeholder="e.g. Code, Layout, Server, Cloud, Zap, Wrench"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Description</label>
              <textarea
                name="description"
                required
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading === "create"}>
                {loading === "create" ? "Creating..." : "Save Service"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" /> Edit Service: {editingService.title}
              </h3>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Title</label>
                  <input
                    name="title"
                    defaultValue={editingService.title}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Slug (URL identifier)</label>
                  <input
                    name="slug"
                    defaultValue={editingService.slug}
                    required
                    pattern="[a-z0-9-]+"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Icon Name</label>
                <input
                  name="icon"
                  defaultValue={editingService.icon || "LayoutTemplate"}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingService.description}
                  required
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setEditingService(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading === "update"}>
                  {loading === "update" ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs">
            <tr>
              <th className="px-6 py-3.5 font-semibold">Service</th>
              <th className="px-6 py-3.5 font-semibold">Slug</th>
              <th className="px-6 py-3.5 font-semibold">Created At</th>
              <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No services match your search query.
                </td>
              </tr>
            ) : (
              filteredServices.map((service) => (
                <tr key={service._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{service.title}</div>
                    <div className="text-muted-foreground text-xs truncate max-w-sm">{service.description}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-primary font-bold">/services/{service.slug}/</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {service.createdAt ? new Date(service.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingService(service)}
                        title="Edit Service"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                        onClick={() => handleDelete(service._id, service.title)}
                        disabled={loading === service._id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
