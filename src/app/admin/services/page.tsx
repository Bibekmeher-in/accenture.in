import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ServicesTable } from "./ServicesTable"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Manage Services | Admin Portal",
}

export default async function AdminServicesPage() {
  const session = await getSession()
  if (!session) return notFound()

  const client = await clientPromise
  const db = client.db("accenture")

  const services = await db.collection("services").find({}).sort({ createdAt: -1 }).toArray()

  const safeServices = services.map(s => ({
    _id: s._id.toString(),
    title: s.title,
    slug: s.slug,
    description: s.description,
    icon: s.icon,
    createdAt: s.createdAt
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Services</h1>
        <p className="text-muted-foreground mt-2">Manage the service offerings displayed on your website.</p>
      </div>

      <ServicesTable services={safeServices} />
    </div>
  )
}
