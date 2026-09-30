"use client"

import * as React from "react"
import { createBlogPost, updateBlogPost, deleteBlogPost, toggleBlogStatus } from "./actions"
import { Trash2, Plus, Edit2, Search, X, Eye, AlertCircle, CheckCircle2, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import type { BlogPost } from "@/data/blog"

export function BlogTable({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [showForm, setShowForm] = React.useState(false)
  const [editingPost, setEditingPost] = React.useState<BlogPost | null>(null)
  const [previewPost, setPreviewPost] = React.useState<BlogPost | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  const categories = React.useMemo(() => {
    const cats = new Set(initialPosts.map((p) => p.category).filter(Boolean))
    return Array.from(cats)
  }, [initialPosts])

  const filteredPosts = React.useMemo(() => {
    return initialPosts.filter((post) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        searchQuery === "" ||
        post.title.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.excerpt?.toLowerCase().includes(q)

      const matchesCat = categoryFilter === "all" || post.category === categoryFilter
      const matchesStatus = statusFilter === "all" || (post.status || "Published") === statusFilter

      return matchesSearch && matchesCat && matchesStatus
    })
  }, [initialPosts, searchQuery, categoryFilter, statusFilter])

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the blog post "${title}"? This cannot be undone.`)) {
      startTransition(async () => {
        const result = await deleteBlogPost(id)
        if (result.success) {
          setMessage({ type: "success", text: `Post "${title}" deleted successfully.` })
          window.location.reload()
        } else {
          setMessage({ type: "error", text: result.error || "Failed to delete post." })
        }
      })
    }
  }

  const handleToggleStatus = (post: BlogPost, newStatus: "Published" | "Draft" | "Archived") => {
    if (!post._id) return
    startTransition(async () => {
      const res = await toggleBlogStatus(post._id!, newStatus)
      if (res.error) {
        setMessage({ type: "error", text: res.error })
      } else {
        setMessage({ type: "success", text: `Post status changed to ${newStatus}.` })
        window.location.reload()
      }
    })
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      title: formData.get("title"),
      slug: (formData.get("slug") as string)?.trim().toLowerCase(),
      category: formData.get("category"),
      type: formData.get("type") || "Article",
      excerpt: formData.get("excerpt"),
      content: formData.get("content"),
      status: formData.get("status") || "Published",
      featured: formData.get("featured") === "on",
    }

    startTransition(async () => {
      const result = await createBlogPost(data)
      if (result.success) {
        setShowForm(false)
        setMessage({ type: "success", text: "Blog post published successfully." })
        window.location.reload()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to create post." })
      }
    })
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingPost || !editingPost._id) return

    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      title: formData.get("title"),
      slug: (formData.get("slug") as string)?.trim().toLowerCase(),
      category: formData.get("category"),
      type: formData.get("type") || "Article",
      excerpt: formData.get("excerpt"),
      content: formData.get("content"),
      status: formData.get("status") || "Published",
      featured: formData.get("featured") === "on",
    }

    startTransition(async () => {
      const result = await updateBlogPost(editingPost._id!, data)
      if (result.success) {
        setEditingPost(null)
        setMessage({ type: "success", text: "Blog post updated successfully." })
        window.location.reload()
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
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Header controls & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles by title, slug, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter blog posts by category"
            className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter blog posts by status"
            className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <Button onClick={() => { setShowForm(!showForm); setEditingPost(null); }} disabled={isPending}>
          {showForm ? "Cancel" : <><Plus className="mr-1.5 h-4 w-4" /> New Article</>}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-6 bg-card border border-border rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-lg text-foreground">Create New Article</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">Title *</label>
              <input required name="title" placeholder="e.g. Next-Gen Enterprise AI Architectures" className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">Slug * (kebab-case)</label>
              <input required name="slug" pattern="[a-z0-9-]+" placeholder="e.g. next-gen-enterprise-ai" className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">Category *</label>
              <input required name="category" placeholder="e.g. Architecture, AI, Engineering" className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">Type *</label>
              <input required name="type" defaultValue="Article" className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">Status</label>
              <select name="status" className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm">
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="blogFeatured" name="featured" className="rounded text-primary focus:ring-primary" />
              <label htmlFor="blogFeatured" className="text-xs font-semibold cursor-pointer">Featured on Home Page Insights</label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-foreground">Excerpt * (Summary for previews)</label>
            <textarea required name="excerpt" rows={2} placeholder="Brief synopsis of the article..." className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-foreground">Content * (HTML or text)</label>
            <textarea required name="content" rows={8} placeholder="<p>Full article body content...</p>" className="w-full border border-border bg-background px-3 py-2 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Publish Article</Button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg">Edit Blog Post</h3>
              <button onClick={() => setEditingPost(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">Title *</label>
                  <input
                    required
                    name="title"
                    defaultValue={editingPost.title}
                    className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">Slug *</label>
                  <input
                    required
                    name="slug"
                    defaultValue={editingPost.slug}
                    pattern="[a-z0-9-]+"
                    className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">Category *</label>
                  <input
                    required
                    name="category"
                    defaultValue={editingPost.category}
                    className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">Type</label>
                  <input
                    required
                    name="type"
                    defaultValue={editingPost.type || "Article"}
                    className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">Status</label>
                  <select
                    name="status"
                    defaultValue={editingPost.status || "Published"}
                    className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="editBlogFeatured"
                    name="featured"
                    defaultChecked={editingPost.featured}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="editBlogFeatured" className="text-xs font-semibold cursor-pointer">Featured on Home Page</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">Excerpt</label>
                <textarea
                  required
                  name="excerpt"
                  rows={2}
                  defaultValue={editingPost.excerpt}
                  className="w-full border border-border bg-background px-3 py-2 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">Content (HTML)</label>
                <textarea
                  required
                  name="content"
                  rows={8}
                  defaultValue={editingPost.content}
                  className="w-full border border-border bg-background px-3 py-2 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
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

      {/* Live Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-4 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-primary uppercase">Article Preview</span>
              <button onClick={() => setPreviewPost(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <span className="px-2.5 py-1 text-xs rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                {previewPost.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{previewPost.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed italic border-l-2 border-primary pl-4">
                {previewPost.excerpt}
              </p>
              <div
                className="prose dark:prose-invert max-w-none text-sm leading-relaxed pt-4 border-t border-border"
                dangerouslySetInnerHTML={{ __html: previewPost.content }}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setPreviewPost(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table view */}
      <div className="overflow-x-auto relative border border-border rounded-2xl bg-card shadow-sm">
        <table className="w-full text-sm text-left min-w-[750px]">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold">Title & Slug</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredPosts.map((post) => (
              <tr key={post.slug} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{post.title}</span>
                    {post.featured && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary border border-primary/20">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">/blog/{post.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-muted text-foreground">
                    {post.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {post._id ? (
                    <select
                      value={post.status || "Published"}
                      onChange={(e) => handleToggleStatus(post, e.target.value as "Published" | "Draft" | "Archived")}
                      disabled={isPending}
                      aria-label={`Change status for ${post.title}`}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border cursor-pointer ${
                        post.status === "Published" || !post.status
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : post.status === "Draft"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                      Preset
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setPreviewPost(post)}
                      className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Quick Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="View public page"
                    >
                      <ArrowUpRight className="h-4 w-4" />
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
