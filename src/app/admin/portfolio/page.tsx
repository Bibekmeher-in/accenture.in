import { Metadata } from "next"
import { PortfolioTable } from "./PortfolioTable"
import { getProjects } from "@/data/projects"

export const metadata: Metadata = {
  title: "Portfolio Management | Admin",
}

export default async function AdminPortfolioPage() {
  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-2">Manage projects and case studies.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6">
        <PortfolioTable initialProjects={projects} />
      </div>
    </div>
  )
}
