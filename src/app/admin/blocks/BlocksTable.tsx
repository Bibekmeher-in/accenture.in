"use client"

import React, { useState, useMemo, useTransition } from "react"
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowUpRight,
  X
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  createContentBlock,
  updateContentBlock,
  deleteContentBlock,
  toggleBlockStatus
} from "./actions"
import type { ContentBlockDoc, BlockType, BlockPlacement, BlockStatus } from "@/lib/blocks"

interface BlocksTableProps {
  initialBlocks: ContentBlockDoc[]
}

const PLACEMENTS: { value: BlockPlacement; label: string }[] = [
  { value: "global", label: "Global (Site-wide)" },
  { value: "home", label: "Home Page" },
  { value: "services", label: "Services Page" },
  { value: "about", label: "About Page" },
  { value: "portfolio", label: "Portfolio Page" },
  { value: "blog", label: "Blog & Insights" },
  { value: "careers", label: "Careers Page" },
  { value: "store", label: "Store & Catalog" },
  { value: "learning", label: "Learning Hub" },
]

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: "cta", label: "Call To Action (CTA)" },
  { value: "banner", label: "Announcement Banner" },
  { value: "hero", label: "Hero Content Block" },
  { value: "announcement", label: "Notification Callout" },
  { value: "html", label: "Custom HTML / Embed" },
]

export function BlocksTable({ initialBlocks }: BlocksTableProps) {
  const [blocks] = useState<ContentBlockDoc[]>(initialBlocks)
  const [isPending, startTransition] = useTransition()

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ContentBlockDoc | null>(null)
  const [previewBlock, setPreviewBlock] = useState<ContentBlockDoc | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlacement, setSelectedPlacement] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Feedback notifications
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Filtered blocks
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        searchQuery === "" ||
        b.title.toLowerCase().includes(q) ||
        b.identifier.toLowerCase().includes(q) ||
        b.heading.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)

      const matchesPlacement = selectedPlacement === "all" || b.placement === selectedPlacement
      const matchesType = selectedType === "all" || b.type === selectedType
      const matchesStatus = selectedStatus === "all" || b.status === selectedStatus

      return matchesSearch && matchesPlacement && matchesType && matchesStatus
    })
  }, [blocks, searchQuery, selectedPlacement, selectedType, selectedStatus])

  // Statistics
  const stats = {
    total: blocks.length,
    published: blocks.filter((b) => b.status === "Published").length,
    draft: blocks.filter((b) => b.status === "Draft").length,
    disabled: blocks.filter((b) => b.status === "Disabled" || b.status === "Archived").length,
  }

  // Handle Create Form Submit
  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAlertMsg(null)

    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      identifier: (formData.get("identifier") as string)?.trim().toLowerCase(),
      title: (formData.get("title") as string)?.trim(),
      type: formData.get("type"),
      placement: formData.get("placement"),
      heading: (formData.get("heading") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || "",
      badge: (formData.get("badge") as string)?.trim() || undefined,
      primaryAction: {
        label: (formData.get("primaryActionLabel") as string)?.trim(),
        href: (formData.get("primaryActionHref") as string)?.trim(),
      },
      secondaryAction: (formData.get("secondaryActionLabel") as string)?.trim()
        ? {
            label: (formData.get("secondaryActionLabel") as string)?.trim(),
            href: (formData.get("secondaryActionHref") as string)?.trim(),
          }
        : undefined,
      customHtml: (formData.get("customHtml") as string)?.trim() || undefined,
      status: formData.get("status") || "Published",
      orderRank: Number(formData.get("orderRank")) || 0,
    }

    startTransition(async () => {
      const res = await createContentBlock(data)
      if (res.error) {
        setAlertMsg({ type: "error", text: res.error })
      } else {
        setIsCreateOpen(false)
        setAlertMsg({ type: "success", text: "Content block created successfully." })
        window.location.reload()
      }
    })
  }

  // Handle Edit Form Submit
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingBlock) return
    setAlertMsg(null)

    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      identifier: (formData.get("identifier") as string)?.trim().toLowerCase(),
      title: (formData.get("title") as string)?.trim(),
      type: formData.get("type"),
      placement: formData.get("placement"),
      heading: (formData.get("heading") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || "",
      badge: (formData.get("badge") as string)?.trim() || undefined,
      primaryAction: {
        label: (formData.get("primaryActionLabel") as string)?.trim(),
        href: (formData.get("primaryActionHref") as string)?.trim(),
      },
      secondaryAction: (formData.get("secondaryActionLabel") as string)?.trim()
        ? {
            label: (formData.get("secondaryActionLabel") as string)?.trim(),
            href: (formData.get("secondaryActionHref") as string)?.trim(),
          }
        : undefined,
      customHtml: (formData.get("customHtml") as string)?.trim() || undefined,
      status: formData.get("status") || "Published",
      orderRank: Number(formData.get("orderRank")) || 0,
    }

    startTransition(async () => {
      const res = await updateContentBlock(editingBlock._id || editingBlock.identifier, data)
      if (res.error) {
        setAlertMsg({ type: "error", text: res.error })
      } else {
        setEditingBlock(null)
        setAlertMsg({ type: "success", text: "Content block updated successfully." })
        window.location.reload()
      }
    })
  }

  // Handle Delete
  const handleDelete = (block: ContentBlockDoc) => {
    const isProtected = block.isProtected
    const confirmText = isProtected
      ? `"${block.title}" is a core system block. Deleting it will safely ARCHIVE it so page layouts remain intact. Continue?`
      : `Are you sure you want to delete content block "${block.title}"? This cannot be undone.`

    if (confirm(confirmText)) {
      startTransition(async () => {
        const res = await deleteContentBlock(block._id || block.identifier)
        if (res.error) {
          setAlertMsg({ type: "error", text: res.error })
        } else {
          setAlertMsg({ type: "success", text: res.message || `Content block "${block.title}" removed.` })
          window.location.reload()
        }
      })
    }
  }

  // Handle Status Toggle
  const handleStatusChange = (block: ContentBlockDoc, newStatus: BlockStatus) => {
    startTransition(async () => {
      const res = await toggleBlockStatus(block._id || block.identifier, newStatus)
      if (res.error) {
        setAlertMsg({ type: "error", text: res.error })
      } else {
        setAlertMsg({ type: "success", text: `Status updated to ${newStatus}.` })
        window.location.reload()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Content Blocks</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">{stats.total}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Active / Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600">{stats.published}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Drafts (Hidden)</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-500">{stats.draft}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Disabled / Archived</span>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2 text-muted-foreground">{stats.disabled}</p>
        </div>
      </div>

      {/* Notifications */}
      {alertMsg && (
        <div
          className={`p-4 rounded-2xl text-sm border flex items-center justify-between ${
            alertMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Search, Filter & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, identifier, or heading..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPlacement}
              onChange={(e) => setSelectedPlacement(e.target.value)}
              aria-label="Filter by page placement"
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Placements</option>
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by block type"
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Types</option>
              {BLOCK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by publish status"
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Disabled">Disabled</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} variant="default" className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" /> Add Content Block
        </Button>
      </div>

      {/* Main Blocks Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-muted/50 text-muted-foreground text-xs font-semibold border-b border-border">
              <tr>
                <th className="py-3.5 px-4">Block Title & Key</th>
                <th className="py-3.5 px-4">Placement / Page</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Heading Content</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filteredBlocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-sm text-foreground">No content blocks found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery ? "Try refining your search or filters." : "Create your first content block."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBlocks.map((block) => (
                  <tr key={block._id || block.identifier} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{block.title}</span>
                        {block.isProtected && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                            Core
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                        key: {block.identifier}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-muted font-medium text-foreground capitalize">
                        {block.placement}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-muted/60 text-muted-foreground uppercase tracking-wide">
                        {block.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <span className="font-medium text-foreground">{block.heading}</span>
                      {block.description && (
                        <p className="text-muted-foreground text-[11px] truncate mt-0.5">{block.description}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={block.status}
                        onChange={(e) => handleStatusChange(block, e.target.value as BlockStatus)}
                        disabled={isPending}
                        aria-label={`Change status for ${block.title}`}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border focus:outline-none cursor-pointer ${
                          block.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : block.status === "Draft"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Disabled">Disabled</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewBlock(block)}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Live Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingBlock(block)}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="Edit Block"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(block)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title={block.isProtected ? "Safely Archive Core Block" : "Delete Block"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Visual Preview Modal */}
      {previewBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Preview Block</span>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{previewBlock.title}</h3>
                <span className="text-xs text-muted-foreground font-mono">key: {previewBlock.identifier}</span>
              </div>
              <button
                onClick={() => setPreviewBlock(null)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rendered Preview Container */}
            <div className="rounded-2xl border border-primary/30 p-8 text-center bg-primary text-primary-foreground shadow-lg">
              {previewBlock.badge && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-widest bg-primary-foreground/20 text-primary-foreground uppercase mb-4">
                  {previewBlock.badge}
                </span>
              )}
              <h2 className="text-2xl sm:text-3xl font-black mb-3">{previewBlock.heading}</h2>
              {previewBlock.description && (
                <p className="text-base sm:text-lg text-primary-foreground/80 max-w-xl mx-auto mb-6">
                  {previewBlock.description}
                </p>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={previewBlock.primaryAction?.href || "#"}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-background text-foreground hover:bg-background/90 transition-all shadow-md flex items-center gap-2"
                >
                  {previewBlock.primaryAction?.label || "Learn More"} <ArrowUpRight className="w-4 h-4" />
                </a>
                {previewBlock.secondaryAction?.label && (
                  <a
                    href={previewBlock.secondaryAction?.href || "#"}
                    className="px-6 py-3 rounded-xl font-bold text-sm border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-all"
                  >
                    {previewBlock.secondaryAction.label}
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center text-xs text-muted-foreground pt-4 border-t border-border">
              <span>Placement: <strong>{previewBlock.placement}</strong></span>
              <Button variant="outline" size="sm" onClick={() => setPreviewBlock(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">New Block</span>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">Create Content Block</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Block Identifier (Unique Slug) *</label>
                  <input
                    name="identifier"
                    required
                    pattern="[a-z0-9-]+"
                    placeholder="e.g. promo-announcement"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Admin Display Title *</label>
                  <input
                    name="title"
                    required
                    placeholder="e.g. Home Promotional CTA"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Block Type</label>
                  <select name="type" className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm">
                    {BLOCK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Page Placement</label>
                  <select name="placement" className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm">
                    {PLACEMENTS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Status</label>
                  <select name="status" className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm">
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Badge / Subheading (Optional)</label>
                <input
                  name="badge"
                  placeholder="e.g. LIMITED TIME OFFER or SPECIAL CAPABILITY"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Main Heading *</label>
                <input
                  name="heading"
                  required
                  placeholder="e.g. Ready to scale your cloud architecture?"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Description Text</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe the offer, message, or prompt..."
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              {/* Primary Action Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/20 border border-border rounded-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Primary Button Label *</label>
                  <input
                    name="primaryActionLabel"
                    required
                    defaultValue="Get Started"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Primary Button URL *</label>
                  <input
                    name="primaryActionHref"
                    required
                    defaultValue="/contact/"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              {/* Secondary Action Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/20 border border-border rounded-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Secondary Button Label (Optional)</label>
                  <input
                    name="secondaryActionLabel"
                    placeholder="e.g. View Services"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Secondary Button URL (Optional)</label>
                  <input
                    name="secondaryActionHref"
                    placeholder="e.g. /services/"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Create Block"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Edit Block</span>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">{editingBlock.title}</h3>
              </div>
              <button
                onClick={() => setEditingBlock(null)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Block Identifier (Unique Slug) *</label>
                  <input
                    name="identifier"
                    defaultValue={editingBlock.identifier}
                    required
                    pattern="[a-z0-9-]+"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Admin Display Title *</label>
                  <input
                    name="title"
                    defaultValue={editingBlock.title}
                    required
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Block Type</label>
                  <select
                    name="type"
                    defaultValue={editingBlock.type}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                  >
                    {BLOCK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Page Placement</label>
                  <select
                    name="placement"
                    defaultValue={editingBlock.placement}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue={editingBlock.status}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Badge / Subheading</label>
                <input
                  name="badge"
                  defaultValue={editingBlock.badge || ""}
                  placeholder="e.g. GET STARTED"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Main Heading *</label>
                <input
                  name="heading"
                  defaultValue={editingBlock.heading}
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Description Text</label>
                <textarea
                  name="description"
                  defaultValue={editingBlock.description}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              {/* Primary Action Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/20 border border-border rounded-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Primary Button Label *</label>
                  <input
                    name="primaryActionLabel"
                    defaultValue={editingBlock.primaryAction?.label || "Get Started"}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Primary Button URL *</label>
                  <input
                    name="primaryActionHref"
                    defaultValue={editingBlock.primaryAction?.href || "/contact/"}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              {/* Secondary Action Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/20 border border-border rounded-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Secondary Button Label (Optional)</label>
                  <input
                    name="secondaryActionLabel"
                    defaultValue={editingBlock.secondaryAction?.label || ""}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Secondary Button URL (Optional)</label>
                  <input
                    name="secondaryActionHref"
                    defaultValue={editingBlock.secondaryAction?.href || ""}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setEditingBlock(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
