"use client"

import { useState, useMemo, useTransition } from "react"
import { Button } from "@/components/ui/Button"
import {
  Trash2,
  Plus,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink
} from "lucide-react"
import { createService, updateService, deleteService, toggleServiceStatus } from "./actions"

interface ServiceItem {
  _id: string
  title: string
  slug: string
  description: string
  icon?: string
  introduction?: string
  covers?: string[]
  benefits?: string[]
  status?: "Published" | "Draft"
  orderRank?: number
  createdAt?: string
  updatedAt?: string
}

export function ServicesTable({ services }: { services: ServiceItem[] }) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchTerm.toLowerCase()
      const matchSearch =
        s.title.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || s.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [services, searchTerm, statusFilter])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading("create")
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      title: formData.get("title"),
      slug: (formData.get("slug") as string)?.trim().toLowerCase(),
      icon: formData.get("icon") || "LayoutTemplate",
      description: formData.get("description"),
      introduction: formData.get("introduction"),
      covers: formData.get("covers"),
      benefits: formData.get("benefits"),
      status: formData.get("status") || "Published",
      orderRank: Number(formData.get("orderRank")) || 0,
    }

    const res = await createService(data)
    if (res.error) {
      setError(res.error)
    } else {
      setIsCreating(false)
      setSuccess("Service created successfully.")
      setTimeout(() => setSuccess(null), 3000)
      window.location.reload()
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
    const data: Record<string, unknown> = {
      title: formData.get("title"),
      slug: (formData.get("slug") as string)?.trim().toLowerCase(),
      icon: formData.get("icon") || "LayoutTemplate",
      description: formData.get("description"),
      introduction: formData.get("introduction"),
      covers: formData.get("covers"),
      benefits: formData.get("benefits"),
      status: formData.get("status") || "Published",
      orderRank: Number(formData.get("orderRank")) || 0,
    }

    const res = await updateService(editingService._id, data)
    if (res.error) {
      setError(res.error)
    } else {
      setEditingService(null)
      setSuccess("Service updated successfully.")
      setTimeout(() => setSuccess(null), 3000)
      window.location.reload()
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
      window.location.reload()
    }
    setLoading(null)
  }

  const handleToggleStatus = (service: ServiceItem, newStatus: "Published" | "Draft") => {
    startTransition(async () => {
      const res = await toggleServiceStatus(service._id, newStatus)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(`Status changed to ${newStatus}.`)
        setTimeout(() => setSuccess(null), 3000)
        window.location.reload()
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
              placeholder="Search services by title or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter services by status"
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {!isCreating && !editingService && (
          <Button onClick={() => setIsCreating(true)} variant="default">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Service
          </Button>
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-base">Create New Service</h3>
            <button onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Title *</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. AI Solutions"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Slug (URL identifier) *</label>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  placeholder="e.g. ai-solutions"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Icon Name (Lucide React)</label>
                <input
                  name="icon"
                  placeholder="e.g. Code, Layout, Server, Cloud, Zap, Wrench, Cpu"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
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
                <input
                  type="number"
                  name="orderRank"
                  defaultValue={services.length + 1}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Short Description (for cards) *</label>
              <textarea
                name="description"
                required
                rows={2}
                placeholder="A high-level summary of the offering..."
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Introduction (for detail page)</label>
              <textarea
                name="introduction"
                rows={3}
                placeholder="In-depth introduction paragraph explaining the service..."
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">What this covers (one item per line)</label>
                <textarea
                  name="covers"
                  rows={4}
                  placeholder="Custom AI Models&#10;LLM Fine-Tuning&#10;Autonomous Agents&#10;Data Ingestion Pipelines"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Key Benefits (one item per line)</label>
                <textarea
                  name="benefits"
                  rows={4}
                  placeholder="Automated business workflows&#10;Higher decision accuracy&#10;Reduced manual overhead&#10;High throughput & speed"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" /> Edit Service: {editingService.title}
              </h3>
              <button onClick={() => setEditingService(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Title *</label>
                  <input
                    name="title"
                    defaultValue={editingService.title}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Slug (URL identifier) *</label>
                  <input
                    name="slug"
                    defaultValue={editingService.slug}
                    required
                    pattern="[a-z0-9-]+"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Icon Name</label>
                  <input
                    name="icon"
                    defaultValue={editingService.icon || "LayoutTemplate"}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingService.status || "Published"}
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
                    defaultValue={editingService.orderRank || 0}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Short Description *</label>
                <textarea
                  name="description"
                  defaultValue={editingService.description}
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Introduction (for detail page)</label>
                <textarea
                  name="introduction"
                  defaultValue={editingService.introduction || editingService.description}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">What this covers (one item per line)</label>
                  <textarea
                    name="covers"
                    defaultValue={(editingService.covers || []).join("\n")}
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Key Benefits (one item per line)</label>
                  <textarea
                    name="benefits"
                    defaultValue={(editingService.benefits || []).join("\n")}
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
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
        <table className="w-full text-sm text-left border-collapse min-w-[750px]">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs">
            <tr>
              <th className="px-6 py-3.5 font-semibold">Service</th>
              <th className="px-6 py-3.5 font-semibold">Slug Identifier</th>
              <th className="px-6 py-3.5 font-semibold">Icon</th>
              <th className="px-6 py-3.5 font-semibold">Status</th>
              <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
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
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono">{service.icon || "LayoutTemplate"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(service, service.status === "Published" ? "Draft" : "Published")}
                      disabled={isPending}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border cursor-pointer ${
                        service.status === "Published"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {service.status || "Published"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <a
                        href={`/services/${service.slug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="View Public Service"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
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
