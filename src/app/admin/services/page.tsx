import { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { getServices } from "@/lib/services-db"
import { ServicesTable } from "./ServicesTable"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Manage Services | Admin Portal",
  description: "Create, edit, and organize technology service capabilities.",
}

export default async function AdminServicesPage() {
  const session = await getSession()
  if (!session) return notFound()

  const services = await getServices({ status: "all" })

  const safeServices = services.map(s => ({
    _id: s._id || s.slug,
    title: s.title,
    slug: s.slug,
    description: s.description,
    icon: s.iconName || "LayoutTemplate",
    introduction: s.introduction || s.description,
    covers: s.covers || [],
    benefits: s.benefits || [],
    status: s.status || "Published",
    orderRank: s.orderRank || 0,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Services Management</h1>
        <p className="text-muted-foreground mt-1">
          Create, edit, publish, and reorder company service capabilities and offering details.
        </p>
      </div>

      <ServicesTable services={safeServices} />
    </div>
  )
}
