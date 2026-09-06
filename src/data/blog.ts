import clientPromise from "@/lib/mongodb"

export type BlogPost = {
  _id?: string
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  category: string
  type: string
}

// Fallback static data if DB is empty
const fallbackPosts: BlogPost[] = [
  {
    slug: "modern-architecture",
    title: "The Evolution of Modern Software Architecture",
    excerpt: "Exploring the shift from monolithic structures to distributed, scalable microservices in enterprise environments.",
    content: "<p>Modern software architecture...</p>",
    date: "2023-11-15T10:00:00Z",
    category: "Architecture",
    type: "Sample Article",
  },
  {
    slug: "accessibility-first",
    title: "Building Accessibility-First Web Applications",
    excerpt: "Why digital inclusion is no longer optional and how to integrate a11y practices early in the development lifecycle.",
    content: "<p>Accessibility is crucial...</p>",
    date: "2023-10-22T14:30:00Z",
    category: "Design",
    type: "Sample Article",
  },
]

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const posts = await db.collection("blog").find({}).sort({ date: -1 }).toArray()

    if (posts.length === 0) {
      return fallbackPosts
    }

    return posts.map(post => ({
      _id: post._id.toString(),
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date,
      category: post.category,
      type: post.type || "Article",
    }))
  } catch (error) {
    console.error("Failed to fetch blog posts from DB", error)
    return fallbackPosts
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const post = await db.collection("blog").findOne({ slug })

    if (post) {
      return {
        _id: post._id.toString(),
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        date: post.date,
        category: post.category,
        type: post.type || "Article",
      }
    }

    // Fallback
    return fallbackPosts.find(p => p.slug === slug)
  } catch (error) {
    console.error("Failed to fetch blog post", error)
    return fallbackPosts.find(p => p.slug === slug)
  }
}
