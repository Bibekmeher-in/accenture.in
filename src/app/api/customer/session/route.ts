import { NextResponse } from "next/server"
import { getCustomerSession } from "@/lib/customer-auth"

export async function GET() {
  const session = await getCustomerSession()
  if (!session) {
    return NextResponse.json({ authenticated: false, session: null })
  }
  return NextResponse.json({ authenticated: true, session })
}
