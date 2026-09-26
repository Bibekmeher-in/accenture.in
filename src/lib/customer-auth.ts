import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"

const key = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-local-development-only-do-not-use-in-production"
)

export const CUSTOMER_SESSION_COOKIE_NAME = "teknixx_customer_session"
export const CUSTOMER_SESSION_EXPIRATION = 7 * 24 * 60 * 60 // 7 days in seconds

export interface CustomerSessionPayload {
  customerId: string
  email: string
  name: string
  role: "customer"
}

export async function createCustomerSessionToken(payload: CustomerSessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key)

  return token
}

export async function verifyCustomerSession(token: string): Promise<CustomerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    })
    
    if (payload.role !== "customer" || !payload.customerId || !payload.email) {
      return null
    }

    return {
      customerId: payload.customerId as string,
      email: payload.email as string,
      name: (payload.name as string) || "",
      role: "customer",
    }
  } catch {
    return null
  }
}

export async function setCustomerSessionCookie(payload: CustomerSessionPayload) {
  const token = await createCustomerSessionToken(payload)
  const cookieStore = await cookies()
  
  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_EXPIRATION,
  })
  
  return token
}

export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value

    if (!sessionCookie) return null

    const payload = await verifyCustomerSession(sessionCookie)
    return payload
  } catch {
    return null
  }
}

export async function requireCustomerAuth(): Promise<
  { authorized: true; session: CustomerSessionPayload } | { authorized: false; error: string; session: null }
> {
  const session = await getCustomerSession()
  if (!session) {
    return { authorized: false, error: "Authentication required to continue.", session: null }
  }
  return { authorized: true, session }
}

export async function clearCustomerSession() {
  const cookieStore = await cookies()
  cookieStore.delete(CUSTOMER_SESSION_COOKIE_NAME)
}
