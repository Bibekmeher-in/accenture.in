import { Metadata } from "next"
import { BlogTable } from "./BlogTable"
import { getBlogPosts } from "@/data/blog"

export const metadata: Metadata = {
  title: "Blog Management | Admin",
}

export default async function AdminBlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Blog</h1>
          <p className="text-muted-foreground mt-2">Manage articles and perspectives.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6">
        <BlogTable initialPosts={posts} />
      </div>
    </div>
  )
}
