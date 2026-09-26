import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { setCustomerSessionCookie } from "@/lib/customer-auth"
import type { CustomerDoc } from "@/lib/customer-types"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const googleError = url.searchParams.get("error")

  const cookieStore = await cookies()
  const rawStateCookie = cookieStore.get("teknixx_oauth_state")?.value
  cookieStore.delete("teknixx_oauth_state")

  let parsedState: { state?: string; returnUrl?: string } = {}
  try {
    if (rawStateCookie) {
      parsedState = JSON.parse(rawStateCookie)
    }
  } catch {
    // Malformed state
  }

  const returnUrl = parsedState.returnUrl || "/account"

  if (googleError || !code || !state || state !== parsedState.state) {
    const errorRedirect = new URL("/auth/login", url.origin)
    errorRedirect.searchParams.set("error", googleError === "access_denied" ? "google_cancelled" : "google_auth_failed")
    if (returnUrl) errorRedirect.searchParams.set("redirect", returnUrl)
    return NextResponse.redirect(errorRedirect)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    const errorRedirect = new URL("/auth/login", url.origin)
    errorRedirect.searchParams.set("error", "google_unconfigured")
    return NextResponse.redirect(errorRedirect)
  }

  try {
    // Exchange authorization code for access and ID tokens
    const callbackUrl = `${url.origin}/api/auth/google/callback`
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      console.error("Google token exchange failed:", await tokenResponse.text())
      const errorRedirect = new URL("/auth/login", url.origin)
      errorRedirect.searchParams.set("error", "google_exchange_failed")
      return NextResponse.redirect(errorRedirect)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch verified profile info from Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userinfoResponse.ok) {
      console.error("Failed to fetch Google userinfo:", await userinfoResponse.text())
      const errorRedirect = new URL("/auth/login", url.origin)
      errorRedirect.searchParams.set("error", "google_profile_failed")
      return NextResponse.redirect(errorRedirect)
    }

    const profile = await userinfoResponse.json()
    const email = profile.email?.trim().toLowerCase()
    const googleSub = profile.sub
    const name = profile.name || profile.given_name || email.split("@")[0]

    if (!email || !profile.email_verified) {
      const errorRedirect = new URL("/auth/login", url.origin)
      errorRedirect.searchParams.set("error", "google_unverified_email")
      return NextResponse.redirect(errorRedirect)
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const customersCollection = db.collection<CustomerDoc>("customers")

    const now = new Date().toISOString()
    let customer = await customersCollection.findOne({ email })

    if (customer) {
      if (customer.status === "Disabled") {
        const errorRedirect = new URL("/auth/login", url.origin)
        errorRedirect.searchParams.set("error", "account_disabled")
        return NextResponse.redirect(errorRedirect)
      }

      // Link google provider if not already linked
      const hasGoogle = customer.authProviders?.some(p => p.provider === "google")
      if (!hasGoogle) {
        await customersCollection.updateOne(
          { _id: customer._id },
          {
            $push: {
              authProviders: {
                provider: "google",
                providerId: googleSub,
                linkedAt: now,
              }
            },
            $set: {
              lastLoginAt: now,
              updatedAt: now,
            }
          }
        )
      } else {
        await customersCollection.updateOne(
          { _id: customer._id },
          { $set: { lastLoginAt: now } }
        )
      }
    } else {
      // Create new customer
      const newCustomer: CustomerDoc = {
        name,
        email,
        authProviders: [
          {
            provider: "google",
            providerId: googleSub,
            linkedAt: now,
          }
        ],
        addresses: [],
        status: "Active",
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        emailVerified: true,
      }

      const insertResult = await customersCollection.insertOne(newCustomer)
      customer = { ...newCustomer, _id: insertResult.insertedId }
    }

    const customerId = customer._id!.toString()

    await setCustomerSessionCookie({
      customerId,
      email,
      name: customer.name || name,
      role: "customer"
    })

    // Safe redirect back to original destination
    const destinationUrl = new URL(returnUrl.startsWith("/") ? returnUrl : `/${returnUrl}`, url.origin)
    return NextResponse.redirect(destinationUrl)
  } catch (err) {
    console.error("Google callback handling error:", err)
    const errorRedirect = new URL("/auth/login", url.origin)
    errorRedirect.searchParams.set("error", "google_server_error")
    return NextResponse.redirect(errorRedirect)
  }
}
