import clientPromise from "@/lib/mongodb"
import { BlogPost, fallbackPosts } from "@/data/blog"

export async function getBlogPosts(options?: { status?: string }): Promise<BlogPost[]> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const query: Record<string, unknown> = {}
    if (options?.status && options.status !== "all") {
      query.status = options.status
    }

    const posts = await db.collection("blog").find(query).sort({ date: -1 }).toArray()

    if (posts.length === 0) {
      if (options?.status && options.status !== "all") {
        return fallbackPosts.filter(p => p.status === options.status)
      }
      return fallbackPosts
    }

    return posts.map(post => ({
      _id: post._id.toString(),
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date || post.createdAt || new Date().toISOString(),
      category: post.category,
      type: post.type || "Article",
      status: post.status || "Published",
      featured: post.featured || false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
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
        date: post.date || post.createdAt || new Date().toISOString(),
        category: post.category,
        type: post.type || "Article",
        status: post.status || "Published",
        featured: post.featured || false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }
    }

    return fallbackPosts.find(p => p.slug === slug)
  } catch (error) {
    console.error("Failed to fetch blog post", error)
    return fallbackPosts.find(p => p.slug === slug)
  }
}
