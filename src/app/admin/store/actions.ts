"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"
import { slugify } from "@/lib/utils"

const VariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().optional(),
  price: z.number().optional(), // if variant has specific price
  stockQuantity: z.number().default(0),
  attributes: z.record(z.string(), z.string()).optional(),
})

const StoreSchema = z.object({
  name: z.string().min(1).max(200),
  shortDescription: z.string().optional(),
  description: z.string().min(1).max(5000),
  category: z.string().min(1),
  productType: z.string().min(1),
  sku: z.string().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  price: z.number().min(0),
  compareAtPrice: z.number().optional(),
  stockQuantity: z.number().default(0),
  trackInventory: z.boolean().default(true),
  allowOutOfStockPurchase: z.boolean().default(false),
  lowStockThreshold: z.number().default(5),
  images: z.array(z.string()).default([]),
  variants: z.array(VariantSchema).default([]),
  status: z.enum(["Draft", "Published", "Archived"]).default("Draft"),
  isFeatured: z.boolean().default(false),
})

export async function createProduct(data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = StoreSchema.safeParse(data)

    if (!parsed.success) {
      console.error("Validation error:", parsed.error)
      return { error: "Invalid product data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Generate unique slug
    const baseSlug = slugify(parsed.data.name)
    let slug = baseSlug
    let counter = 1
    while (await db.collection("products").findOne({ slug })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const productDoc = {
      ...parsed.data,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("products").insertOne(productDoc)

    await logAudit({
      actor: session.username,
      action: "STORE_PRODUCT_CREATED",
      entity: "Store",
      entityId: result.insertedId.toString(),
      metadata: { name: parsed.data.name }
    })

    revalidatePath("/store")
    revalidatePath("/admin/store")
    return { success: true, slug }
  } catch (err) {
    console.error("Create product error:", err)
    return { error: "Failed to create product" }
  }
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const parsed = StoreSchema.safeParse(data)

    if (!parsed.success) {
      console.error("Validation error:", parsed.error)
      return { error: "Invalid product data" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // Update slug if name changed significantly, but usually better to keep slug stable unless requested.
    // We will keep existing slug for simplicity.

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: session.username,
      action: "STORE_PRODUCT_UPDATED",
      entity: "Store",
      entityId: id,
      metadata: { name: parsed.data.name }
    })

    revalidatePath("/store")
    revalidatePath("/admin/store")
    return { success: true }
  } catch (err) {
    console.error("Update product error:", err)
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
      metadata: { name: productToDelete.name }
    })

    revalidatePath("/store")
    revalidatePath("/admin/store")
    return { success: true }
  } catch (err) {
    console.error("Delete product error:", err)
    return { error: "Failed to delete product" }
  }
}

export async function archiveProduct(id: string) {
  try {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "Archived",
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: session.username,
      action: "STORE_PRODUCT_UPDATED",
      entity: "Store",
      entityId: id,
      metadata: {}
    })

    revalidatePath("/store")
    revalidatePath("/admin/store")
    return { success: true }
  } catch {
    return { error: "Failed to archive product" }
  }
}
