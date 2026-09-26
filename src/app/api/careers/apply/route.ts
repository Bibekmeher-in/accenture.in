import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { requireCustomerAuth } from "@/lib/customer-auth"
import { saveResumeFile, getSafeExtension } from "@/lib/storage"
import { logAudit } from "@/lib/audit"
import type { CareerApplicationDoc } from "@/lib/customer-types"

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream", // some browsers send this for docx/doc
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  try {
    // 1. Enforce Server-Side Customer Authentication
    const auth = await requireCustomerAuth()
    if (!auth.authorized) {
      return NextResponse.json(
        { error: "Please sign in to upload your resume." },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const name = ((formData.get("name") as string) || auth.session.name || "").trim()
    const email = ((formData.get("email") as string) || auth.session.email || "").trim().toLowerCase()
    const phone = ((formData.get("phone") as string) || "").trim()
    const coverNote = ((formData.get("coverNote") as string) || "").trim()

    if (!file) {
      return NextResponse.json({ error: "Please select a resume file to upload." }, { status: 400 })
    }

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please provide your full name." }, { status: 400 })
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 })
    }

    // 2. File Validation
    const ext = getSafeExtension(file.name)
    if (!ext) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, and DOCX files are supported." },
        { status: 400 }
      )
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload a valid PDF or Word document." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit. Please upload a smaller file." },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 })
    }

    // 3. Save file to private disk storage (outside MongoDB)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const originalFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")

    const savedFile = await saveResumeFile(buffer, originalFilename)

    // 4. Save metadata to MongoDB careerApplications collection
    const client = await clientPromise
    const db = client.db("accenture")
    const applicationsCollection = db.collection<CareerApplicationDoc>("careerApplications")

    const now = new Date().toISOString()
    const applicationDoc: CareerApplicationDoc = {
      customerId: auth.session.customerId,
      name,
      email,
      phone: phone || undefined,
      coverNote: coverNote || undefined,
      originalFilename,
      storageKey: savedFile.storageKey,
      filePath: savedFile.filePath,
      mimeType: file.type || "application/octet-stream",
      fileSize: savedFile.fileSize,
      status: "Pending Review",
      notes: [],
      createdAt: now,
      updatedAt: now,
    }

    const insertResult = await applicationsCollection.insertOne(applicationDoc)
    const applicationId = insertResult.insertedId.toString()

    // 5. Audit Log
    await logAudit({
      actor: `Customer:${auth.session.email}`,
      action: "CAREER_RESUME_UPLOADED",
      entity: "CareerApplication",
      entityId: applicationId,
      metadata: { originalFilename, fileSize: savedFile.fileSize }
    })

    return NextResponse.json({
      success: true,
      applicationId,
      message: "Your resume has been uploaded successfully. We will contact you if a suitable position becomes available."
    })
  } catch (err) {
    console.error("Resume upload error:", err)
    return NextResponse.json(
      { error: "An error occurred while uploading your resume. Please try again." },
      { status: 500 }
    )
  }
}
