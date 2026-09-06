"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcryptjs"
import { z } from "zod"

const UserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  role: z.enum(["admin", "super_admin"]),
})

export async function createUser(usernameRaw: string, passwordRaw: string, roleRaw: string) {
  try {
    const { authorized, session } = await requireRole("super_admin")
    if (!authorized || !session) return { error: "Unauthorized" }

    const parsed = UserSchema.safeParse({ username: usernameRaw, password: passwordRaw, role: roleRaw })
    if (!parsed.success) {
      return { error: "Invalid user data" }
    }

    const { username, password, role } = parsed.data

    const client = await clientPromise
    const db = client.db("accenture")

    // Check if user exists
    const existing = await db.collection("admin").findOne({ username })
    if (existing) {
      return { error: "Username already exists" }
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const result = await db.collection("admin").insertOne({
      username,
      passwordHash,
      role,
      createdAt: new Date()
    })

    await logAudit({
      actor: session.username,
      action: "ADMIN_CREATED",
      entity: "Admin",
      entityId: result.insertedId.toString(),
      metadata: { newUsername: username, assignedRole: role }
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch {
    return { error: "Failed to create user" }
  }
}

export async function deleteUser(id: string) {
  try {
    const { authorized, session } = await requireRole("super_admin")
    if (!authorized || !session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    const userToDelete = await db.collection("admin").findOne({ _id: new ObjectId(id) })
    if (!userToDelete) return { error: "User not found" }

    // Prevent deleting the last super_admin
    if (userToDelete.role === "super_admin") {
      const superAdminCount = await db.collection("admin").countDocuments({ role: "super_admin" })
      if (superAdminCount <= 1) {
        return { error: "Cannot delete the last super_admin." }
      }
    }

    await db.collection("admin").deleteOne({ _id: new ObjectId(id) })

    await logAudit({
      actor: session.username,
      action: "ADMIN_DELETED",
      entity: "Admin",
      entityId: id,
      metadata: { deletedUsername: userToDelete.username }
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch {
    return { error: "Failed to delete user" }
  }
}

export async function updateRole(id: string, newRole: string) {
  try {
    const { authorized, session } = await requireRole("super_admin")
    if (!authorized || !session) return { error: "Unauthorized" }

    if (newRole !== "admin" && newRole !== "super_admin") {
      return { error: "Invalid role" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const userToUpdate = await db.collection("admin").findOne({ _id: new ObjectId(id) })
    if (!userToUpdate) return { error: "User not found" }

    // Prevent demoting the last super_admin
    if (userToUpdate.role === "super_admin" && newRole === "admin") {
      const superAdminCount = await db.collection("admin").countDocuments({ role: "super_admin" })
      if (superAdminCount <= 1) {
        return { error: "Cannot demote the last super_admin." }
      }
    }

    await db.collection("admin").updateOne(
      { _id: new ObjectId(id) },
      { $set: { role: newRole } }
    )

    await logAudit({
      actor: session.username,
      action: "ADMIN_ROLE_CHANGED",
      entity: "Admin",
      entityId: id,
      metadata: { targetUsername: userToUpdate.username, newRole }
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch {
    return { error: "Failed to update role" }
  }
}
