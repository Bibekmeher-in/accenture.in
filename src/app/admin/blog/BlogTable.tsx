"use client"

import * as React from "react"
import { createBlogPost, deleteBlogPost } from "./actions"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { BlogPost } from "@/data/blog"

export function BlogTable({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [showForm, setShowForm] = React.useState(false)

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      startTransition(async () => {
        await deleteBlogPost(id)
      })
    }
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    startTransition(async () => {
      const result = await createBlogPost(data)
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
          {showForm ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> New Post</>}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-muted/20 border border-border rounded-lg space-y-4">
          <h3 className="font-bold text-lg mb-4">Create New Article</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input required name="title" className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input required name="slug" className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input required name="category" className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type (e.g. Article)</label>
              <input required name="type" defaultValue="Article" className="w-full border p-2 rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Excerpt</label>
            <textarea required name="excerpt" rows={2} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content (HTML)</label>
            <textarea required name="content" rows={6} className="w-full border p-2 rounded font-mono text-sm" />
          </div>

          <Button type="submit" disabled={isPending}>Save Post</Button>
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
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialPosts.map((post) => (
              <tr key={post.slug} className="hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{post.title}</td>
                <td className="px-6 py-4">{post.category}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(post.date).toISOString().split('T')[0]}
                </td>
                <td className="px-6 py-4 text-right">
                  {post._id && (
                    <button
                      onClick={() => handleDelete(post._id!)}
                      disabled={isPending}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {!post._id && (
                    <span className="text-xs text-muted-foreground italic">Static fallback</span>
                  )}
                </td>
              </tr>
            ))}
            {initialPosts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No articles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
