import React from "react"
import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { ApplicationsTable } from "./ApplicationsTable"
import { Briefcase, FileCheck, Clock, CheckCircle2, Archive } from "lucide-react"
import type { CareerApplicationDoc } from "@/lib/customer-types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Careers & Resumes | Admin Portal",
}

export default async function AdminCareersPage() {
  let applicationsRaw: CareerApplicationDoc[] = []

  try {
    const client = await clientPromise
    const db = client.db("accenture")

    applicationsRaw = await db
      .collection<CareerApplicationDoc>("careerApplications")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
  } catch (err) {
    console.error("Failed to fetch career applications:", err)
  }

  const applications = applicationsRaw.map((app) => ({
    _id: app._id!.toString(),
    customerId: app.customerId,
    name: app.name,
    email: app.email,
    phone: app.phone || "",
    coverNote: app.coverNote || "",
    originalFilename: app.originalFilename,
    storageKey: app.storageKey,
    filePath: app.filePath,
    mimeType: app.mimeType,
    fileSize: app.fileSize,
    status: app.status,
    notes: (app.notes || []).map(n => ({
      author: n.author,
      text: n.text,
      timestamp: n.timestamp
    })),
    createdAt: app.createdAt || new Date().toISOString(),
    updatedAt: app.updatedAt || new Date().toISOString(),
  }))

  const totalApplications = applications.length
  const pendingReview = applications.filter((a) => a.status === "Pending Review").length
  const underConsideration = applications.filter((a) => a.status === "Under Consideration").length
  const interviewing = applications.filter((a) => a.status === "Interviewing").length
  const archived = applications.filter((a) => a.status === "Archived" || a.status === "Rejected").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Careers & Resume Submissions</h1>
          <p className="text-muted-foreground mt-1">
            Review applicant profiles, securely download submitted resumes, track hiring stages, and record team evaluation notes.
          </p>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Resumes</span>
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">{totalApplications}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-500">{pendingReview}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Under Consideration</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-500">{underConsideration}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Interviewing</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{interviewing}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Archived / Rejected</span>
            <Archive className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2 text-muted-foreground">{archived}</p>
        </div>
      </div>

      {/* Applications Table with Search, Filter & Drawer */}
      <ApplicationsTable initialApplications={applications} />
    </div>
  )
}
