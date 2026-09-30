import React from "react"
import { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { notFound } from "next/navigation"
import { getContentBlocks } from "@/lib/blocks"
import { BlocksTable } from "./BlocksTable"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Content Blocks & CTAs | Admin Portal",
  description: "Manage reusable website content blocks, call-to-action sections, and promotional banners.",
}

export default async function AdminBlocksPage() {
  const session = await getSession()
  if (!session) return notFound()

  const blocks = await getContentBlocks({ status: "all" })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Blocks & CTAs</h1>
          <p className="text-muted-foreground mt-1">
            Manage reusable call-to-action sections, promotional banners, and page callouts with live preview.
          </p>
        </div>
      </div>

      <BlocksTable initialBlocks={blocks} />
    </div>
  )
}
