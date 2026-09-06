"use client"

import * as React from "react"
import { createPortfolioProject, deletePortfolioProject } from "./actions"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { Project } from "@/data/projects"

export function PortfolioTable({ initialProjects }: { initialProjects: Project[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [showForm, setShowForm] = React.useState(false)

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      startTransition(async () => {
        await deletePortfolioProject(id)
      })
    }
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    startTransition(async () => {
      const result = await createPortfolioProject(data)
      if (result.success) {
        setShowForm(false)
      } else {
        alert(result.error)
      }
    })
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} disabled={isPending}>
          {showForm ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> New Project</>}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-muted/20 border border-border rounded-lg space-y-4">
          <h3 className="font-bold text-lg mb-4">Add New Project</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input required name="title" className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type (e.g. Sample Project)</label>
              <input required name="type" defaultValue="Sample Project" className="w-full border p-2 rounded" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
              <input name="tags" placeholder="React, Node.js, AWS" className="w-full border p-2 rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea required name="description" rows={3} className="w-full border p-2 rounded" />
          </div>

          <Button type="submit" disabled={isPending}>Save Project</Button>
        </form>
      )}

      <div className="overflow-x-auto relative">
        {isPending && (
          <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Tags</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialProjects.map((project, i) => (
              <tr key={project._id || i} className="hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{project.title}</td>
                <td className="px-6 py-4">{project.type}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {project.tags.join(", ")}
                </td>
                <td className="px-6 py-4 text-right">
                  {project._id && (
                    <button
                      onClick={() => handleDelete(project._id!)}
                      disabled={isPending}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {!project._id && (
                    <span className="text-xs text-muted-foreground italic">Static fallback</span>
                  )}
                </td>
              </tr>
            ))}
            {initialProjects.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
