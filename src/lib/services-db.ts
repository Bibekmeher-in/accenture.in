import clientPromise from "@/lib/mongodb"
import { Service, fallbackServices, resolveIcon } from "@/data/services"

export async function getServices(options?: { status?: string }): Promise<Service[]> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const query: Record<string, unknown> = {}
    if (options?.status && options.status !== "all") {
      query.status = options.status
    }

    const docs = await db
      .collection("services")
      .find(query)
      .sort({ orderRank: 1, createdAt: -1 })
      .toArray()

    if (docs.length === 0) {
      if (options?.status && options.status !== "all") {
        return fallbackServices.filter(s => s.status === options.status)
      }
      return fallbackServices
    }

    return docs.map(doc => {
      const iconName = doc.icon || "LayoutTemplate"
      const fallbackMatch = fallbackServices.find(f => f.slug === doc.slug)

      return {
        _id: doc._id.toString(),
        slug: doc.slug,
        title: doc.title,
        description: doc.description,
        icon: resolveIcon(iconName),
        iconName,
        introduction: doc.introduction || fallbackMatch?.introduction || doc.description,
        covers: Array.isArray(doc.covers) && doc.covers.length > 0 ? doc.covers : fallbackMatch?.covers || [
          "Custom Implementation",
          "Technical Architecture",
          "Quality Assurance",
          "Post-Launch Maintenance"
        ],
        benefits: Array.isArray(doc.benefits) && doc.benefits.length > 0 ? doc.benefits : fallbackMatch?.benefits || [
          "Tailored to business workflows",
          "High performance & reliability",
          "Scalable modern architecture",
          "Continuous engineering support"
        ],
        status: doc.status || "Published",
        orderRank: doc.orderRank || 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }
    })
  } catch (error) {
    console.error("Failed to fetch services from DB:", error)
    return fallbackServices
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | undefined> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const doc = await db.collection("services").findOne({ slug })

    if (doc) {
      const iconName = doc.icon || "LayoutTemplate"
      const fallbackMatch = fallbackServices.find(f => f.slug === doc.slug)

      return {
        _id: doc._id.toString(),
        slug: doc.slug,
        title: doc.title,
        description: doc.description,
        icon: resolveIcon(iconName),
        iconName,
        introduction: doc.introduction || fallbackMatch?.introduction || doc.description,
        covers: Array.isArray(doc.covers) && doc.covers.length > 0 ? doc.covers : fallbackMatch?.covers || [
          "Custom Implementation",
          "Technical Architecture",
          "Quality Assurance",
          "Post-Launch Maintenance"
        ],
        benefits: Array.isArray(doc.benefits) && doc.benefits.length > 0 ? doc.benefits : fallbackMatch?.benefits || [
          "Tailored to business workflows",
          "High performance & reliability",
          "Scalable modern architecture",
          "Continuous engineering support"
        ],
        status: doc.status || "Published",
        orderRank: doc.orderRank || 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }
    }

    return fallbackServices.find(s => s.slug === slug)
  } catch (error) {
    console.error("Failed to fetch service by slug:", error)
    return fallbackServices.find(s => s.slug === slug)
  }
}
