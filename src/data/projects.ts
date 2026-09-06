import clientPromise from "@/lib/mongodb"

export type Project = {
  _id?: string
  title: string
  description: string
  type: string
  tags: string[]
  imageUrl?: string
}

const fallbackProjects: Project[] = [
  {
    title: "Global Supply Chain Dashboard",
    description: "A real-time logistics visualization platform resolving supply chain bottlenecks for a Fortune 500 retailer.",
    type: "Sample Project",
    tags: ["React", "Node.js", "WebSockets", "D3.js"],
  },
  {
    title: "Fintech Mobile Application",
    description: "A secure, cross-platform mobile app enabling seamless international transfers with multi-currency wallets.",
    type: "Concept Project",
    tags: ["React Native", "TypeScript", "PostgreSQL", "AWS"],
  },
]

export async function getProjects(): Promise<Project[]> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const projects = await db.collection("portfolio").find({}).toArray()

    if (projects.length === 0) {
      return fallbackProjects
    }

    return projects.map(proj => ({
      _id: proj._id.toString(),
      title: proj.title,
      description: proj.description,
      type: proj.type || "Sample Project",
      tags: proj.tags || [],
      imageUrl: proj.imageUrl,
    }))
  } catch (error) {
    console.error("Failed to fetch projects from DB", error)
    return fallbackProjects
  }
}
