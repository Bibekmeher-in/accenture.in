"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Trash2, LayoutTemplate, Plus } from "lucide-react"
import { createService, deleteService } from "./actions"

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
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading("create")
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    const res = await createService(data)
    if (res.error) {
      setError(res.error)
    } else {
      setIsCreating(false)
    }
    setLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return
    setLoading(id)
    setError(null)
    const res = await deleteService(id)
    if (res?.error) setError(res.error)
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
        <div className="bg-red-500/10 text-red-500 p-4 rounded-md text-sm border border-red-500/20">
          {error}
        </div>
      )}

      {!isCreating && services.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreating(true)} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      )}

      {isCreating && (
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="font-bold mb-4">Create New Service</h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  name="title"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon Name (Lucide React)</label>
              <input
                name="icon"
                placeholder="e.g. Code, Layout, Server"
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                required
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              />
            </div>
            <div className="flex gap-2">
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

      {services.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Service</th>
                <th className="px-6 py-4 font-medium">Slug</th>
                <th className="px-6 py-4 font-medium">Created At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((service) => (
                <tr key={service._id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{service.title}</div>
                    <div className="text-muted-foreground text-xs truncate max-w-xs">{service.description}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">/{service.slug}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(service.createdAt).toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                      onClick={() => handleDelete(service._id)}
                      disabled={loading === service._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
