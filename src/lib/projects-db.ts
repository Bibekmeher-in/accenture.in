import clientPromise from "@/lib/mongodb"
import { Project, fallbackProjects } from "@/data/projects"

export async function getProjects(options?: { status?: string }): Promise<Project[]> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const query: Record<string, unknown> = {}
    if (options?.status && options.status !== "all") {
      query.status = options.status
    }

    const projects = await db
      .collection("portfolio")
      .find(query)
      .sort({ orderRank: 1, createdAt: -1 })
      .toArray()

    if (projects.length === 0) {
      if (options?.status && options.status !== "all") {
        return fallbackProjects.filter(p => p.status === options.status)
      }
      return fallbackProjects
    }

    return projects.map(proj => ({
      _id: proj._id.toString(),
      title: proj.title,
      description: proj.description,
      type: proj.type || "Sample Project",
      tags: proj.tags || [],
      imageUrl: proj.imageUrl,
      status: proj.status || "Published",
      orderRank: proj.orderRank || 0,
      featured: proj.featured || false,
      createdAt: proj.createdAt,
      updatedAt: proj.updatedAt,
    }))
  } catch (error) {
    console.error("Failed to fetch projects from DB", error)
    return fallbackProjects
  }
}
