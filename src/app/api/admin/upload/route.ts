import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { promises as fs } from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    const folder = formData.get("folder") as string || "store"
    const safeFolder = ["store", "learning", "blog", "portfolio"].includes(folder) ? folder : "misc"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate mime type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WEBP, GIF, and PDF are allowed." }, { status: 400 })
    }

    // Validate size (e.g., max 10MB to accommodate PDFs)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit." }, { status: 400 })
    }

    // Create a safe, unique filename
    const ext = path.extname(file.name) || ".jpg" // Fallback if no ext
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const safeFilename = `${uniqueSuffix}${ext}`

    // Ensure the upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder)
    await fs.mkdir(uploadDir, { recursive: true })

    // Save the file
    const filePath = path.join(uploadDir, safeFilename)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    await fs.writeFile(filePath, buffer)

    // Return the URL reference to the file
    const url = `/uploads/${safeFolder}/${safeFilename}`

    return NextResponse.json({ success: true, url })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
