"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { z } from "zod"
import {
  setCustomerSessionCookie,
  clearCustomerSession,
  requireCustomerAuth
} from "@/lib/customer-auth"
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit"
import type { CustomerAddress } from "@/lib/customer-types"

// Schemas
const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

const AddressSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: z.string().trim().min(10, "Phone number is required"),
  streetAddress: z.string().trim().min(5, "Street address is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pinCode: z.string().trim().min(4, "PIN / Postal code is required"),
  isDefault: z.boolean().optional(),
})

export async function registerCustomer(formData: {
  name: string
  email: string
  password: string
  confirmPassword: string
}) {
  try {
    const rateCheck = checkRateLimit(`register:${formData.email || "ip"}`, 5, 15 * 60 * 1000)
    if (!rateCheck.allowed) {
      return { error: "Too many registration attempts. Please try again later." }
    }

    const parsed = RegisterSchema.safeParse(formData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid registration data" }
    }

    const { name, email, password } = parsed.data
    const client = await clientPromise
    const db = client.db("accenture")
    const customersCollection = db.collection("customers")

    const existingCustomer = await customersCollection.findOne({ email })
    if (existingCustomer) {
      // Check if email auth already exists
      const hasEmailAuth = existingCustomer.authProviders?.some((p: { provider: string }) => p.provider === "email")
      if (hasEmailAuth) {
        return { error: "An account with this email already exists. Please sign in." }
      } else {
        // Customer was created with Google OAuth, link email auth
        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password, salt)

        await customersCollection.updateOne(
          { _id: existingCustomer._id },
          {
            $set: {
              name: existingCustomer.name || name,
              passwordHash,
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
            $push: {
              authProviders: {
                provider: "email",
                linkedAt: new Date().toISOString(),
              }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
          }
        )

        const customerId = existingCustomer._id.toString()
        await setCustomerSessionCookie({
          customerId,
          email,
          name: existingCustomer.name || name,
          role: "customer"
        })

        resetRateLimit(`register:${email}`)
        return { success: true, customerId }
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)
    const now = new Date().toISOString()

    const newCustomerDoc = {
      name,
      email,
      passwordHash,
      authProviders: [
        {
          provider: "email",
          linkedAt: now,
        }
      ],
      addresses: [],
      status: "Active",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    }

    const result = await customersCollection.insertOne(newCustomerDoc)
    const customerId = result.insertedId.toString()

    await setCustomerSessionCookie({
      customerId,
      email,
      name,
      role: "customer"
    })

    resetRateLimit(`register:${email}`)
    return { success: true, customerId }
  } catch (err) {
    console.error("Registration error:", err)
    return { error: "An unexpected error occurred during registration. Please try again." }
  }
}

export async function loginCustomer(formData: { email: string; password: string }) {
  try {
    const parsed = LoginSchema.safeParse(formData)
    if (!parsed.success) {
      return { error: "Invalid email or password." }
    }

    const { email, password } = parsed.data
    const rateCheck = checkRateLimit(`login:${email}`, 5, 10 * 60 * 1000)
    if (!rateCheck.allowed) {
      return { error: "Too many failed login attempts. Please wait a few minutes before trying again." }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne({ email })

    if (!customer || !customer.passwordHash) {
      return { error: "Invalid email or password." }
    }

    if (customer.status === "Disabled") {
      return { error: "Your account has been deactivated. Please contact support for assistance." }
    }

    const isValid = await bcrypt.compare(password, customer.passwordHash)
    if (!isValid) {
      return { error: "Invalid email or password." }
    }

    const now = new Date().toISOString()
    await db.collection("customers").updateOne(
      { _id: customer._id },
      { $set: { lastLoginAt: now } }
    )

    const customerId = customer._id.toString()
    await setCustomerSessionCookie({
      customerId,
      email: customer.email,
      name: customer.name,
      role: "customer"
    })

    resetRateLimit(`login:${email}`)
    return { success: true, customerId }
  } catch (err) {
    console.error("Login error:", err)
    return { error: "An unexpected error occurred during sign in." }
  }
}

export async function logoutCustomer() {
  await clearCustomerSession()
  revalidatePath("/")
  return { success: true }
}

export async function requestPasswordReset(emailRaw: string) {
  try {
    const email = emailRaw.trim().toLowerCase()
    if (!email || !email.includes("@")) {
      return { error: "Please enter a valid email address." }
    }

    const rateCheck = checkRateLimit(`reset-request:${email}`, 3, 15 * 60 * 1000)
    if (!rateCheck.allowed) {
      return { error: "Too many reset requests. Please try again later." }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne({ email })

    if (customer && customer.status !== "Disabled") {
      const resetToken = crypto.randomBytes(32).toString("hex")
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

      await db.collection("customers").updateOne(
        { _id: customer._id },
        {
          $set: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: expires,
          }
        }
      )

      return { 
        success: true, 
        message: "If an account exists with this email, password reset instructions have been generated.",
        debugToken: process.env.NODE_ENV === "development" ? resetToken : undefined
      }
    }

    return { 
      success: true, 
      message: "If an account exists with this email, password reset instructions have been generated." 
    }
  } catch (err) {
    console.error("Password reset request error:", err)
    return { error: "Failed to process password reset request." }
  }
}

export async function resetPassword(formData: { token: string; password: string; confirmPassword: string }) {
  try {
    const { token, password, confirmPassword } = formData
    if (!token) return { error: "Missing reset token." }

    if (!password || password.length < 8) {
      return { error: "Password must be at least 8 characters." }
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match." }
    }

    const rateCheck = checkRateLimit(`reset-attempt:${token.slice(0, 10)}`, 5, 15 * 60 * 1000)
    if (!rateCheck.allowed) {
      return { error: "Too many attempts. Please request a new password reset link." }
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    const now = new Date().toISOString()

    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: now },
    })

    if (!customer) {
      return { error: "This password reset link is invalid or has expired." }
    }

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    await db.collection("customers").updateOne(
      { _id: customer._id },
      {
        $set: {
          passwordHash,
          updatedAt: now,
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        }
      }
    )

    return { success: true, message: "Your password has been reset successfully. You can now sign in." }
  } catch (err) {
    console.error("Password reset error:", err)
    return { error: "Failed to reset password." }
  }
}

export async function changePassword(formData: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  try {
    const auth = await requireCustomerAuth()
    if (!auth.authorized) return { error: "Unauthorized" }

    const { currentPassword, newPassword, confirmPassword } = formData

    if (!newPassword || newPassword.length < 8) {
      return { error: "New password must be at least 8 characters long." }
    }

    if (newPassword !== confirmPassword) {
      return { error: "New passwords do not match." }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne({ 
      _id: new ObjectId(auth.session.customerId) 
    })

    if (!customer) return { error: "Customer not found." }

    if (customer.passwordHash) {
      const isValid = await bcrypt.compare(currentPassword, customer.passwordHash)
      if (!isValid) {
        return { error: "Current password is incorrect." }
      }
    }

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    await db.collection("customers").updateOne(
      { _id: customer._id },
      {
        $set: {
          passwordHash,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    return { success: true, message: "Password updated successfully." }
  } catch (err) {
    console.error("Change password error:", err)
    return { error: "Failed to change password." }
  }
}

export async function getCurrentCustomer() {
  try {
    const auth = await requireCustomerAuth()
    if (!auth.authorized) return null

    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne(
      { _id: new ObjectId(auth.session.customerId) },
      { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
    )

    if (!customer) return null

    return {
      id: customer._id.toString(),
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      authProviders: customer.authProviders || [],
      addresses: (customer.addresses || []) as CustomerAddress[],
      status: (customer.status || "Active") as "Active" | "Disabled",
      createdAt: customer.createdAt || "",
      lastLoginAt: customer.lastLoginAt || "",
    }
  } catch (err) {
    console.error("getCurrentCustomer error:", err)
    return null
  }
}

export async function updateCustomerProfile(data: { name: string; phone?: string }) {
  try {
    const auth = await requireCustomerAuth()
    if (!auth.authorized) return { error: "Unauthorized" }

    const name = data.name.trim()
    if (!name || name.length < 2) {
      return { error: "Name must be at least 2 characters long." }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    
    await db.collection("customers").updateOne(
      { _id: new ObjectId(auth.session.customerId) },
      {
        $set: {
          name,
          phone: data.phone?.trim() || "",
          updatedAt: new Date().toISOString(),
        }
      }
    )

    // Update cookie session if name changed
    await setCustomerSessionCookie({
      customerId: auth.session.customerId,
      email: auth.session.email,
      name,
      role: "customer"
    })

    revalidatePath("/account")
    return { success: true }
  } catch (err) {
    console.error("updateCustomerProfile error:", err)
    return { error: "Failed to update profile." }
  }
}

export async function saveCustomerAddress(addressData: Partial<CustomerAddress>) {
  try {
    const auth = await requireCustomerAuth()
    if (!auth.authorized) return { error: "Unauthorized" }

    const parsed = AddressSchema.safeParse(addressData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid address data" }
    }

    const validAddress = parsed.data
    const addressId = validAddress.id || `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    
    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne({
      _id: new ObjectId(auth.session.customerId)
    })

    if (!customer) return { error: "Customer not found" }

    let addresses = (customer.addresses || []) as CustomerAddress[]
    const isFirstAddress = addresses.length === 0
    const shouldBeDefault = validAddress.isDefault || isFirstAddress

    if (shouldBeDefault) {
      addresses = addresses.map(a => ({ ...a, isDefault: false }))
    }

    const existingIndex = addresses.findIndex(a => a.id === addressId)
    const newAddressItem: CustomerAddress = {
      id: addressId,
      fullName: validAddress.fullName,
      phone: validAddress.phone,
      streetAddress: validAddress.streetAddress,
      city: validAddress.city,
      state: validAddress.state,
      pinCode: validAddress.pinCode,
      isDefault: shouldBeDefault,
    }

    if (existingIndex >= 0) {
      addresses[existingIndex] = newAddressItem
    } else {
      addresses.push(newAddressItem)
    }

    await db.collection("customers").updateOne(
      { _id: new ObjectId(auth.session.customerId) },
      {
        $set: {
          addresses,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    revalidatePath("/account")
    revalidatePath("/checkout")
    return { success: true, address: newAddressItem }
  } catch (err) {
    console.error("saveCustomerAddress error:", err)
    return { error: "Failed to save address." }
  }
}

export async function deleteCustomerAddress(addressId: string) {
  try {
    const auth = await requireCustomerAuth()
    if (!auth.authorized) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")
    
    await db.collection("customers").updateOne(
      { _id: new ObjectId(auth.session.customerId) },
      {
        $pull: {
          addresses: { id: addressId }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        $set: {
          updatedAt: new Date().toISOString(),
        }
      }
    )

    revalidatePath("/account")
    revalidatePath("/checkout")
    return { success: true }
  } catch (err) {
    console.error("deleteCustomerAddress error:", err)
    return { error: "Failed to delete address." }
  }
}

export async function setDefaultAddress(addressId: string) {
  try {
    const auth = await requireCustomerAuth()
    if (!auth.authorized) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne({
      _id: new ObjectId(auth.session.customerId)
    })

    if (!customer || !customer.addresses) return { error: "Customer not found" }

    const updatedAddresses = (customer.addresses as CustomerAddress[]).map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }))

    await db.collection("customers").updateOne(
      { _id: new ObjectId(auth.session.customerId) },
      {
        $set: {
          addresses: updatedAddresses,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    revalidatePath("/account")
    revalidatePath("/checkout")
    return { success: true }
  } catch (err) {
    console.error("setDefaultAddress error:", err)
    return { error: "Failed to set default address." }
  }
}
