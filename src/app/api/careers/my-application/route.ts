import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getCustomerSession } from "@/lib/customer-auth"
import type { CareerApplicationDoc } from "@/lib/customer-types"

export async function GET() {
  try {
    const session = await getCustomerSession()
    if (!session) {
      return NextResponse.json({ authenticated: false, application: null })
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const application = await db.collection<CareerApplicationDoc>("careerApplications").findOne(
      { customerId: session.customerId },
      { sort: { createdAt: -1 } }
    )

    if (!application) {
      return NextResponse.json({ authenticated: true, application: null })
    }

    return NextResponse.json({
      authenticated: true,
      application: {
        id: application._id?.toString(),
        name: application.name,
        email: application.email,
        phone: application.phone,
        originalFilename: application.originalFilename,
        fileSize: application.fileSize,
        status: application.status,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      }
    })
  } catch (err) {
    console.error("Fetch application error:", err)
    return NextResponse.json({ authenticated: false, application: null }, { status: 500 })
  }
}
