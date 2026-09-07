import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"

const CheckoutSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pinCode: z.string().min(1),
  }),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1),
  })).min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = CheckoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid checkout data", details: parsed.error }, { status: 400 })
    }

    const { customer, items } = parsed.data

    const client = await clientPromise
    const db = client.db("accenture")
    const productsCollection = db.collection("products")

    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      // Validate product
      const product = await productsCollection.findOne({ 
        _id: new ObjectId(item.productId),
        status: "Published"
      })

      if (!product) {
        return NextResponse.json({ error: `Product not found or unavailable: ${item.productId}` }, { status: 400 })
      }

      let unitPrice = product.price
      const itemName = product.name
      let variantName = null

      if (item.variantId) {
        const variant = product.variants?.find((v: Record<string, unknown>) => v.id === item.variantId)
        if (!variant) {
          return NextResponse.json({ error: `Variant not found: ${item.variantId}` }, { status: 400 })
        }
        if (variant.price !== undefined) {
          unitPrice = variant.price
        }
        variantName = variant.name

        // Check stock for variant
        if (product.trackInventory && !product.allowOutOfStockPurchase) {
          if (variant.stockQuantity < item.quantity) {
             return NextResponse.json({ error: `Insufficient stock for ${itemName} - ${variantName}` }, { status: 400 })
          }
        }
      } else {
        // Check stock for main product
        if (product.trackInventory && !product.allowOutOfStockPurchase) {
          if (product.stockQuantity < item.quantity) {
             return NextResponse.json({ error: `Insufficient stock for ${itemName}` }, { status: 400 })
          }
        }
      }

      const lineTotal = unitPrice * item.quantity
      subtotal += lineTotal

      orderItems.push({
        productId: product._id.toString(),
        variantId: item.variantId,
        name: itemName,
        variantName,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      })
    }

    const total = subtotal // Add tax/shipping logic here if needed later

    const orderDoc = {
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customer,
      items: orderItems,
      subtotal,
      total,
      currency: "INR",
      orderStatus: "Pending",
      paymentStatus: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection("orders").insertOne(orderDoc)

    // Deduct stock (simplified)
    for (const item of orderItems) {
      if (item.variantId) {
        await productsCollection.updateOne(
          { _id: new ObjectId(item.productId), "variants.id": item.variantId },
          { $inc: { "variants.$.stockQuantity": -item.quantity } }
        )
      } else {
        await productsCollection.updateOne(
          { _id: new ObjectId(item.productId) },
          { $inc: { stockQuantity: -item.quantity } }
        )
      }
    }

    return NextResponse.json({ success: true, orderId: orderDoc.orderId })

  } catch (err) {
    console.error("Checkout error:", err)
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 })
  }
}
