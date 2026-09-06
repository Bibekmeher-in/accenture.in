"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const StoreSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().min(0),
  isPublished: z.boolean(),
  imageRef: z.string().optional(),
})

export async function createProduct(data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = StoreSchema.safeParse({
      title: data.title,
      description: data.description,
      price: parseFloat(String(data.price || "0")),
      isPublished: data.isPublished === "true" || data.isPublished === true,
      imageRef: data.imageRef,
    })

    if (!parsed.success) {
      return { error: "Invalid product data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    const result = await db.collection("products").insertOne({
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      isPublished: parsed.data.isPublished,
      imageRef: parsed.data.imageRef || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await logAudit({
      actor: session.username,
      action: "STORE_PRODUCT_CREATED",
      entity: "Store",
      entityId: result.insertedId.toString(),
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/store")
    revalidatePath("/admin/store")
    return { success: true }
  } catch {
    return { error: "Failed to create product" }
  }
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = StoreSchema.safeParse({
      title: data.title,
      description: data.description,
      price: parseFloat(String(data.price || "0")),
      isPublished: data.isPublished === "true" || data.isPublished === true,
      imageRef: data.imageRef,
    })

    if (!parsed.success) {
      return { error: "Invalid product data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: parsed.data.title,
          description: parsed.data.description,
          price: parsed.data.price,
          isPublished: parsed.data.isPublished,
          imageRef: parsed.data.imageRef || "",
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: session.username,
      action: "STORE_PRODUCT_UPDATED",
      entity: "Store",
      entityId: id,
      metadata: { title: parsed.data.title }
    })

    revalidatePath("/store")
    revalidatePath("/admin/store")
    return { success: true }
  } catch {
    return { error: "Failed to update product" }
  }
}

export async function deleteProduct(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    const productToDelete = await db.collection("products").findOne({ _id: new ObjectId(id) })
    if (!productToDelete) return { error: "Product not found" }

    await db.collection("products").deleteOne({ _id: new ObjectId(id) })

    await logAudit({
      actor: session.username,
      action: "STORE_PRODUCT_DELETED",
      entity: "Store",
      entityId: id,
      metadata: { title: productToDelete.title }
    })

    revalidatePath("/store")
    revalidatePath("/admin/store")
    return { success: true }
  } catch {
    return { error: "Failed to delete product" }
  }
}
