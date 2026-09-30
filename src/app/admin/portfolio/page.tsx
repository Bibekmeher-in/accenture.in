import { Metadata } from "next"
import { PortfolioTable } from "./PortfolioTable"
import { getProjects } from "@/lib/projects-db"
import { getSession } from "@/lib/auth"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Portfolio Management | Admin",
  description: "Manage portfolio case studies, concept projects, tags, and showcase ordering.",
}

export default async function AdminPortfolioPage() {
  const session = await getSession()
  if (!session) return notFound()

  const projects = await getProjects({ status: "all" })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Portfolio Projects</h1>
          <p className="text-muted-foreground mt-1">Manage public case studies, client implementations, and showcase projects.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6">
        <PortfolioTable initialProjects={projects} />
      </div>
    </div>
  )
}
