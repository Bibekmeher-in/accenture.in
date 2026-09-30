export type Project = {
  _id?: string
  title: string
  description: string
  type: string
  tags: string[]
  imageUrl?: string
  status?: "Published" | "Draft" | "Archived"
  orderRank?: number
  featured?: boolean
  createdAt?: string
  updatedAt?: string
}

export const fallbackProjects: Project[] = [
  {
    title: "Global Supply Chain Dashboard",
    description: "A real-time logistics visualization platform resolving supply chain bottlenecks for a Fortune 500 retailer.",
    type: "Sample Project",
    tags: ["React", "Node.js", "WebSockets", "D3.js"],
    status: "Published",
    orderRank: 1,
    featured: true,
  },
  {
    title: "Fintech Mobile Application",
    description: "A secure, cross-platform mobile app enabling seamless international transfers with multi-currency wallets.",
    type: "Concept Project",
    tags: ["React Native", "TypeScript", "PostgreSQL", "AWS"],
    status: "Published",
    orderRank: 2,
    featured: true,
  },
]

export const projects = fallbackProjects
