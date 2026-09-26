import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { getResumeFileBuffer } from "@/lib/storage"
import type { CareerApplicationDoc } from "@/lib/customer-types"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Enforce Admin Authentication (Strictly an Admin function)
    const adminSession = await getSession()
    const isAdmin = Boolean(adminSession && ["admin", "super_admin"].includes(adminSession.role))

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin authorization required to download candidate resumes." },
        { status: 403 }
      )
    }

    const { id } = await context.params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const application = await db.collection<CareerApplicationDoc>("careerApplications").findOne({
      _id: new ObjectId(id)
    })

    if (!application) {
      return NextResponse.json({ error: "Application or resume not found" }, { status: 404 })
    }

    // 2. Fetch raw buffer from persistent storage (local, S3, or Vercel Blob)
    const fileBuffer = await getResumeFileBuffer(application.storageKey)
    if (!fileBuffer) {
      return NextResponse.json({ error: "Resume file could not be located in storage." }, { status: 404 })
    }

    const sanitizedFilename = (application.originalFilename || "resume.pdf").replace(/[^a-zA-Z0-9._-]/g, "_")

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": application.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    })
  } catch (err) {
    console.error("Admin resume download error:", err)
    return NextResponse.json({ error: "Failed to download resume" }, { status: 500 })
  }
}
