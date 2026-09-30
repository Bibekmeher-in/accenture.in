import { Metadata } from "next"
import { BlogTable } from "./BlogTable"
import { getBlogPosts } from "@/lib/blog-db"
import { getSession } from "@/lib/auth"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog Management | Admin Portal",
  description: "Create, edit, publish, and manage engineering insights and perspective articles.",
}

export default async function AdminBlogPage() {
  const session = await getSession()
  if (!session) return notFound()

  const posts = await getBlogPosts({ status: "all" })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Blog & Insights</h1>
          <p className="text-muted-foreground mt-1">Manage articles, editorial drafts, and featured insights.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6">
        <BlogTable initialPosts={posts} />
      </div>
    </div>
  )
}
