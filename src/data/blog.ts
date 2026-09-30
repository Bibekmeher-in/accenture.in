export type BlogPost = {
  _id?: string
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  category: string
  type: string
  status?: "Published" | "Draft" | "Archived"
  featured?: boolean
  createdAt?: string
  updatedAt?: string
}

export const fallbackPosts: BlogPost[] = [
  {
    slug: "modern-architecture",
    title: "The Evolution of Modern Software Architecture",
    excerpt: "Exploring the shift from monolithic structures to distributed, scalable microservices in enterprise environments.",
    content: "<p>Modern software architecture prioritizes modularity, maintainability, and horizontal scalability. By decoupling application boundaries and establishing resilient service communication, engineering teams build systems that adapt rapidly to evolving business needs.</p>",
    date: "2023-11-15T10:00:00Z",
    category: "Architecture",
    type: "Sample Article",
    status: "Published",
    featured: true,
  },
  {
    slug: "accessibility-first",
    title: "Building Accessibility-First Web Applications",
    excerpt: "Why digital inclusion is no longer optional and how to integrate a11y practices early in the development lifecycle.",
    content: "<p>Accessibility is fundamental to digital design. Implementing semantic HTML, comprehensive keyboard navigation, and WCAG-compliant color contrast ensures interfaces are usable by everyone regardless of assistive device or environmental constraints.</p>",
    date: "2023-10-22T14:30:00Z",
    category: "Design",
    type: "Sample Article",
    status: "Published",
    featured: true,
  },
]

export const posts = fallbackPosts
