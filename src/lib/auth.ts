import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"

const key = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-local-development-only-do-not-use-in-production"
)

export const SESSION_COOKIE_NAME = "accenture_admin_session"
export const SESSION_EXPIRATION = 24 * 60 * 60 // 24 hours in seconds

export async function createSession(payload: Record<string, string>) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key)

  return token
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    })
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) return null

  const payload = await verifySession(sessionCookie)
  if (!payload) return null

  return {
    username: payload.username as string,
    role: payload.role as string,
  }
}

export async function requireRole(requiredRole: "super_admin" | "admin") {
  const session = await getSession()
  if (!session) return { authorized: false, error: "Unauthorized" }

  if (requiredRole === "super_admin" && session.role !== "super_admin") {
    return { authorized: false, error: "Forbidden: Super Admin access required." }
  }

  return { authorized: true, session }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
