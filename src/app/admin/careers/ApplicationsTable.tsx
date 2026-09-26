"use client"

import * as React from "react"
import { Search, Filter, Download, FileText, ChevronRight, X, Send, Trash2, Mail, Phone, Calendar } from "lucide-react"
import { updateApplicationStatus, addApplicationNote, deleteApplication } from "./actions"

export type ApplicationItem = {
  _id: string
  customerId: string
  name: string
  email: string
  phone: string
  coverNote: string
  originalFilename: string
  storageKey: string
  filePath: string
  mimeType: string
  fileSize: number
  status: string
  notes: Array<{ author: string; text: string; timestamp: string }>
  createdAt: string
  updatedAt: string
}

export function ApplicationsTable({ initialApplications }: { initialApplications: ApplicationItem[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [selectedApp, setSelectedApp] = React.useState<ApplicationItem | null>(null)
  const [newNoteText, setNewNoteText] = React.useState("")

  const filteredApps = initialApplications.filter((app) => {
    const query = search.toLowerCase()
    const matchesSearch =
      app.name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.originalFilename.toLowerCase().includes(query) ||
      (app.phone && app.phone.toLowerCase().includes(query))
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending Review":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      case "Under Consideration":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
      case "Interviewing":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
      case "Rejected":
        return "bg-destructive/10 text-destructive border border-destructive/20"
      case "Archived":
        return "bg-muted text-muted-foreground border border-border"
      default:
        return "bg-primary/10 text-primary border border-primary/20"
    }
  }

  const handleStatusChange = (appId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateApplicationStatus(appId, newStatus)
      if (res.error) {
        alert(res.error)
      } else if (selectedApp && selectedApp._id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus })
      }
    })
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !newNoteText.trim()) return

    startTransition(async () => {
      const res = await addApplicationNote(selectedApp._id, newNoteText)
      if (res.error) {
        alert(res.error)
      } else if (res.note) {
        setSelectedApp({
          ...selectedApp,
          notes: [...selectedApp.notes, res.note],
        })
        setNewNoteText("")
      }
    })
  }

  const handleDelete = (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this application and resume?")) return

    startTransition(async () => {
      const res = await deleteApplication(appId)
      if (res.error) {
        alert(res.error)
      } else {
        setSelectedApp(null)
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB"
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col relative">
      {isPending && (
        <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-muted/10">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Application Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Under Consideration">Under Consideration</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Archived">Archived</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold">Applicant</th>
              <th className="px-6 py-4 font-semibold">Contact Info</th>
              <th className="px-6 py-4 font-semibold">Resume / CV</th>
              <th className="px-6 py-4 font-semibold">Date Submitted</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No applications found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr
                  key={app._id}
                  className="hover:bg-muted/20 transition-colors group cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {app.name ? app.name.charAt(0).toUpperCase() : "A"}
                      </div>
                      <span className="font-bold">{app.name}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-muted-foreground">
                    <div>{app.email}</div>
                    {app.phone && <div className="text-xs text-muted-foreground/80">{app.phone}</div>}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium text-foreground truncate max-w-[160px]" title={app.originalFilename}>
                        {app.originalFilename}
                      </span>
                      <span className="text-xs text-muted-foreground">({formatFileSize(app.fileSize)})</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(app.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/api/careers/resume/${app._id}/download`}
                        title="Download Resume"
                        className="p-2 hover:bg-muted rounded-lg text-primary transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Application Details Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-card border-l border-border shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Application Details</span>
                    <h3 className="text-xl font-bold text-foreground mt-1">{selectedApp.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Application Status</label>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => handleStatusChange(selectedApp._id, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="Pending Review">Pending Review</option>
                    <option value="Under Consideration">Under Consideration</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Archived">Archived</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Contact Info */}
                <div className="bg-muted/20 border border-border rounded-2xl p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground font-medium">{selectedApp.email}</span>
                  </div>
                  {selectedApp.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{selectedApp.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Submitted: {new Date(selectedApp.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Resume Download Box */}
                <div className="bg-card border border-primary/20 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{selectedApp.originalFilename}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedApp.fileSize)}</p>
                    </div>
                  </div>
                  <a
                    href={`/api/careers/resume/${selectedApp._id}/download`}
                    className="px-3.5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>

                {/* Cover Note */}
                {selectedApp.coverNote && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Applicant Cover Note</label>
                    <div className="p-4 bg-muted/20 border border-border rounded-2xl text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedApp.coverNote}
                    </div>
                  </div>
                )}

                {/* Admin Internal Notes */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-foreground">Internal Team Notes ({selectedApp.notes.length})</label>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedApp.notes.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No internal notes added yet.</p>
                    ) : (
                      selectedApp.notes.map((note, idx) => (
                        <div key={idx} className="p-3 bg-muted/30 border border-border rounded-xl text-xs space-y-1">
                          <div className="flex justify-between font-semibold text-foreground">
                            <span>{note.author}</span>
                            <span className="text-muted-foreground text-[10px]">{new Date(note.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-muted-foreground">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an internal note..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="submit"
                      disabled={isPending || !newNoteText.trim()}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-border mt-6">
                <button
                  onClick={() => handleDelete(selectedApp._id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-destructive/20"
                >
                  <Trash2 className="w-4 h-4" /> Delete Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
