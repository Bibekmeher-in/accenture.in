import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRATION } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcryptjs"

// In-memory rate limiter for login
const loginRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const LOGIN_RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes
const MAX_LOGIN_ATTEMPTS = 5

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const now = Date.now()

    const rateData = loginRateLimitMap.get(ip)
    if (rateData) {
      if (now > rateData.resetTime) {
        loginRateLimitMap.set(ip, { count: 1, resetTime: now + LOGIN_RATE_LIMIT_WINDOW })
      } else if (rateData.count >= MAX_LOGIN_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          { status: 429 }
        )
      } else {
        loginRateLimitMap.set(ip, { count: rateData.count + 1, resetTime: rateData.resetTime })
      }
    } else {
      loginRateLimitMap.set(ip, { count: 1, resetTime: now + LOGIN_RATE_LIMIT_WINDOW })
    }

    const { password } = await request.json()
    const username = "admin"

    if (!password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const adminCollection = db.collection("admin")

    let adminUser = await adminCollection.findOne({ username })
    let isValid = false

    if (adminUser) {
      isValid = await bcrypt.compare(password, adminUser.passwordHash)
    } else {
      // Fallback for first-time setup
      const count = await adminCollection.countDocuments()
      const fallbackPassword = process.env.INITIAL_ADMIN_PASSWORD
      if (count === 0 && username === "admin" && fallbackPassword && password === fallbackPassword) {
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, salt)
        const result = await adminCollection.insertOne({
          username: "admin",
          passwordHash,
          role: "super_admin",
          createdAt: new Date()
        })
        isValid = true
        adminUser = { _id: result.insertedId, username: "admin", role: "super_admin" }
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Reset rate limit on success
    loginRateLimitMap.delete(ip)

    const token = await createSession({ username, role: adminUser?.role || "admin" })
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRATION,
      path: "/",
    })

    await logAudit({
      actor: username,
      action: "ADMIN_LOGIN",
      entity: "Session",
      metadata: { ip: ip === "unknown" ? undefined : ip }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 })
  }
}
