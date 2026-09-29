"use client"

import * as React from "react"
import { createBlogPost, updateBlogPost, deleteBlogPost } from "./actions"
import { Trash2, Plus, Edit2, Search, X, Check, Eye } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import type { BlogPost } from "@/data/blog"

export function BlogTable({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [showForm, setShowForm] = React.useState(false)
  const [editingPost, setEditingPost] = React.useState<BlogPost | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  const categories = React.useMemo(() => {
    const cats = new Set(initialPosts.map((p) => p.category).filter(Boolean))
    return Array.from(cats)
  }, [initialPosts])

  const filteredPosts = React.useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesSearch =
        searchQuery === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCat = categoryFilter === "all" || post.category === categoryFilter
      return matchesSearch && matchesCat
    })
  }, [initialPosts, searchQuery, categoryFilter])

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the blog post "${title}"? This cannot be undone.`)) {
      startTransition(async () => {
        const result = await deleteBlogPost(id)
        if (result.success) {
          setMessage({ type: "success", text: `Post "${title}" deleted successfully.` })
        } else {
          setMessage({ type: "error", text: result.error || "Failed to delete post." })
        }
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
        setMessage({ type: "success", text: "Blog post published successfully." })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to create post." })
      }
    })
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingPost || !editingPost._id) return

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    startTransition(async () => {
      const result = await updateBlogPost(editingPost._id!, data)
      if (result.success) {
        setEditingPost(null)
        setMessage({ type: "success", text: "Blog post updated successfully." })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update post." })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Feedback message banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Header controls & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles by title, slug, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter blog posts by category"
            className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={() => { setShowForm(!showForm); setEditingPost(null); }} disabled={isPending}>
          {showForm ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> New Article</>}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-6 bg-card/60 backdrop-blur border border-border/80 rounded-xl space-y-4 shadow-sm">
          <h3 className="font-bold text-lg text-foreground">Create New Article</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Title *</label>
              <input required name="title" placeholder="e.g. Next-Gen Enterprise AI Architectures" className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Slug * (kebab-case)</label>
              <input required name="slug" placeholder="e.g. next-gen-enterprise-ai" className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-xs" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Category *</label>
              <input required name="category" placeholder="e.g. Engineering, AI, Cloud" className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Type *</label>
              <input required name="type" defaultValue="Article" className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Excerpt * (Summary for previews)</label>
            <textarea required name="excerpt" rows={2} placeholder="Brief synopsis of the article..." className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Content * (HTML or Markdown)</label>
            <textarea required name="content" rows={8} placeholder="<p>Full article body content...</p>" className="w-full border border-border bg-background/50 p-2.5 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Publish Article</Button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg">Edit Blog Post</h3>
              <button onClick={() => setEditingPost(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Title *</label>
                  <input
                    required
                    name="title"
                    defaultValue={editingPost.title}
                    className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Slug *</label>
                  <input
                    required
                    name="slug"
                    defaultValue={editingPost.slug}
                    className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Category *</label>
                  <input
                    required
                    name="category"
                    defaultValue={editingPost.category}
                    className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Type</label>
                  <input
                    required
                    name="type"
                    defaultValue={editingPost.type || "Article"}
                    className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Excerpt</label>
                <textarea
                  required
                  name="excerpt"
                  rows={2}
                  defaultValue={editingPost.excerpt}
                  className="w-full border border-border bg-background/50 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Content (HTML)</label>
                <textarea
                  required
                  name="content"
                  rows={8}
                  defaultValue={editingPost.content}
                  className="w-full border border-border bg-background/50 p-2.5 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingPost(null)}>
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

      {/* Table view */}
      <div className="overflow-x-auto relative border border-border rounded-xl bg-card">
        {isPending && (
          <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-xs">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Title & Slug</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPosts.map((post) => (
              <tr key={post.slug} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground">{post.title}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">/blog/{post.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
                    {post.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                  {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="View public post"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    {post._id ? (
                      <>
                        <button
                          onClick={() => setEditingPost(post)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="Edit article"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post._id!, post.title)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg border border-border/80 hover:bg-rose-500/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete article"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic px-2">Static</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredPosts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No articles matched your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
