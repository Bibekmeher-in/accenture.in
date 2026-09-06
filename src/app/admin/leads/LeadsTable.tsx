"use client"

import * as React from "react"
import { updateLeadStatus, updateLeadPriority, addLeadNote, getLeadActivities, deleteLead } from "./actions"
import { Search, Filter, MessageSquare, Phone, Mail, FileText, ChevronRight, X, Send, Users, Trash2 } from "lucide-react"
const toast = {
  success: (msg: string) => { if (typeof window !== 'undefined') window.alert(msg) },
  error: (msg: string) => { if (typeof window !== 'undefined') window.alert("Error: " + msg) }
}

export type LeadNote = { author: string; text: string; timestamp: string }
export type LeadActivity = {
  _id: string
  action: string
  actor: string
  timestamp: string
  notes?: string
  metadata?: Record<string, unknown>
}

export type Lead = {
  _id: string
  name: string
  email: string
  company: string
  phone: string
  service: string
  message: string
  status: string
  priority: string
  assignedTo?: string
  followUpDate?: string
  followUpReason?: string
  notes: LeadNote[]
  createdAt: string
  updatedAt?: string
}

export function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)

  const filteredLeads = initialLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
                          lead.email.toLowerCase().includes(search.toLowerCase()) ||
                          lead.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500/10 text-blue-500"
      case "qualified": return "bg-emerald-500/10 text-emerald-500"
      case "won": return "bg-green-500/10 text-green-500 border border-green-500"
      case "lost": return "bg-red-500/10 text-red-500"
      case "closed": return "bg-muted text-muted-foreground"
      case "contacted": return "bg-purple-500/10 text-purple-500"
      default: return "bg-primary/10 text-primary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "urgent": return "text-red-500 font-bold"
      case "high": return "text-orange-500 font-semibold"
      case "low": return "text-muted-foreground"
      default: return "text-foreground"
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {isPending && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-muted/10">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-background border border-border text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto relative flex-1 min-h-[400px]">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <Users className="h-12 w-12 opacity-20 mb-4" />
            <p>No leads found matching your criteria.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status / Priority</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead._id}
                  onClick={() => setSelectedLead(lead)}
                  className={`cursor-pointer transition-colors ${selectedLead?._id === lead._id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30 border-l-2 border-l-transparent'}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{lead.name}</div>
                    <div className="flex items-center text-muted-foreground text-xs mt-1 gap-3">
                      <span className="flex items-center"><Mail className="h-3 w-3 mr-1" />{lead.email}</span>
                      {lead.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" />{lead.phone}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{lead.company || "N/A"}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{lead.service}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-y-2">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className={`text-xs ${getPriorityColor(lead.priority)}`}>
                      Priority: {lead.priority}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <span className="text-xs">{new Date(lead.createdAt).toISOString().split('T')[0]}</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer Overlay */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSelectedLead(null)}
        />
      )}

      {/* Lead Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full md:w-[600px] bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedLead && (
          <LeadDetailView
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}
      </div>
    </div>
  )
}

function LeadDetailView({ lead, onClose, isPending, startTransition }: { lead: Lead, onClose: () => void, isPending: boolean, startTransition: React.TransitionStartFunction }) {
  const [activeTab, setActiveTab] = React.useState<"details"|"notes"|"activities">("details")
  const [noteText, setNoteText] = React.useState("")
  const [activities, setActivities] = React.useState<LeadActivity[]>([])
  const [loadingActivities, setLoadingActivities] = React.useState(false)

  const hasFetchedActivities = React.useRef(false)

  React.useEffect(() => {
    let isMounted = true
    if (activeTab === "activities" && !hasFetchedActivities.current) {
      hasFetchedActivities.current = true
      setLoadingActivities(true)
      getLeadActivities(lead._id).then(res => {
        if (isMounted) {
          if (res.success && res.activities) {
            setActivities(res.activities as LeadActivity[])
          }
          setLoadingActivities(false)
        }
      })
    }
    return () => { isMounted = false }
  }, [activeTab, lead._id])

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      const res = await updateLeadStatus(lead._id, status)
      if (res.error) toast.error(res.error)
      else {
        toast.success("Status updated")
        lead.status = status // Optimistic UI
      }
    })
  }

  const handlePriorityChange = (priority: string) => {
    startTransition(async () => {
      const res = await updateLeadPriority(lead._id, priority)
      if (res.error) toast.error(res.error)
      else {
        toast.success("Priority updated")
        lead.priority = priority // Optimistic UI
      }
    })
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return
    startTransition(async () => {
      const res = await addLeadNote(lead._id, noteText)
      if (res.error) toast.error(res.error)
      else {
        toast.success("Note added")
        // Optimistic UI for note is trickier since we need the author, but we'll let Next.js revalidate update the prop
        setNoteText("")
      }
    })
  }

  return (
    <div className="h-full flex flex-col relative">
      {isPending && (
        <div className="absolute inset-0 bg-background/20 z-10 backdrop-blur-[1px]"></div>
      )}

      {/* Drawer Header */}
      <div className="p-6 border-b border-border flex justify-between items-start bg-muted/10">
        <div>
          <h2 className="text-xl font-bold">{lead.name}</h2>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
            <span className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {lead.email}</span>
            {lead.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {lead.phone}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this lead? This cannot be undone.")) {
                startTransition(async () => {
                  const res = await deleteLead(lead._id)
                  if (res?.error) toast.error(res.error)
                  else {
                    toast.success("Lead deleted")
                    onClose()
                  }
                })
              }
            }}
            disabled={isPending}
            className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
            title="Delete Lead"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Actions / Status Bar */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap gap-4 items-center bg-background">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isPending}
            className="bg-background border border-border text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Priority</label>
          <select
            value={lead.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            disabled={isPending}
            className="bg-background border border-border text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="flex-1 flex justify-end gap-2 mt-4 sm:mt-0">
          <a href={`mailto:${lead.email}`} className="flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
            <Mail className="h-4 w-4 mr-2" /> Email
          </a>
          {lead.phone && (
            <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors">
              <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-6 border-b border-border bg-background pt-2">
        {(["details", "notes", "activities"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/5">

        {activeTab === "details" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center"><FileText className="h-4 w-4 mr-2" /> Inquiry Message</h3>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{lead.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Service Interest</h3>
                <p className="text-sm font-medium">{lead.service}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Company</h3>
                <p className="text-sm font-medium">{lead.company || "Not provided"}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Date Submitted</h3>
                <p className="text-sm font-medium">{new Date(lead.createdAt).toISOString().replace('T', ' ').substring(0, 16)}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Follow Up</h3>
                <p className="text-sm font-medium">{lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : "Not set"}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 space-y-4 mb-6">
              {lead.notes.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-8 w-8 mx-auto opacity-20 mb-2" />
                  <p className="text-sm">No internal notes yet.</p>
                </div>
              ) : (
                lead.notes.map((note, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">{note.author}</span>
                      <span className="text-xs text-muted-foreground">{new Date(note.timestamp).toISOString().replace('T', ' ').substring(0, 16)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Add Internal Note</label>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Type internal note here... (Client will not see this)"
                className="w-full min-h-[80px] bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddNote}
                  disabled={isPending || !noteText.trim()}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4 mr-2" /> Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <div className="space-y-6">
            {loadingActivities ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">No activity recorded.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6">
                {activities.map((act, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[31px] top-1 h-3 w-3 bg-primary rounded-full ring-4 ring-background"></div>
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold">{act.action.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-muted-foreground">{new Date(act.timestamp).toISOString().replace('T', ' ').substring(0, 16)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        By <span className="font-semibold text-foreground">{act.actor}</span>
                      </div>
                      {act.notes && (
                        <div className="mt-2 text-sm italic border-l-2 border-primary/30 pl-2">
                          &quot;{String(act.notes)}&quot;
                        </div>
                      )}
                      {act.metadata && Object.keys(act.metadata).length > 0 && (
                        <div className="mt-2 bg-muted/50 p-2 rounded text-xs font-mono break-all">
                          {JSON.stringify(act.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
