import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"
import { requireCustomerAuth } from "@/lib/customer-auth"
import { logAudit } from "@/lib/audit"

const CheckoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().email("Valid email address is required"),
    phone: z.string().trim().min(10, "Phone number is required"),
    streetAddress: z.string().trim().min(3, "Street address is required"),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().min(2, "State is required"),
    pinCode: z.string().trim().min(4, "PIN / Postal code is required"),
    saveAddress: z.boolean().optional(),
  }),
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
  })).min(1, "Cart must contain at least one item"),
})

export async function POST(req: Request) {
  try {
    // 1. Authorize Customer Session Server-Side
    const auth = await requireCustomerAuth()
    if (!auth.authorized) {
      return NextResponse.json(
        { error: "Authentication required to place an order. Please sign in." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = CheckoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout data", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { customer, items } = parsed.data
    const customerId = auth.session.customerId

    const client = await clientPromise
    const db = client.db("accenture")
    const productsCollection = db.collection("products")
    const ordersCollection = db.collection("orders")
    const customersCollection = db.collection("customers")

    let subtotal = 0
    const orderItems = []

    // 2. Authoritative Price & Stock Verification Server-Side
    for (const item of items) {
      if (!ObjectId.isValid(item.productId)) {
        return NextResponse.json({ error: `Invalid product ID format: ${item.productId}` }, { status: 400 })
      }

      const product = await productsCollection.findOne({ 
        _id: new ObjectId(item.productId),
        status: "Published"
      })

      if (!product) {
        return NextResponse.json({ error: `Product not found or unavailable in store catalog: ${item.productId}` }, { status: 400 })
      }

      let unitPrice = Number(product.price)
      const itemName = product.name
      let variantName = null

      if (item.variantId) {
        const variant = product.variants?.find((v: Record<string, unknown>) => v.id === item.variantId)
        if (!variant) {
          return NextResponse.json({ error: `Variant not found for product: ${itemName}` }, { status: 400 })
        }
        if (variant.price !== undefined && variant.price !== null) {
          unitPrice = Number(variant.price)
        }
        variantName = variant.name

        // Check stock for variant
        if (product.trackInventory && !product.allowOutOfStockPurchase) {
          if ((variant.stockQuantity || 0) < item.quantity) {
             return NextResponse.json({ error: `Insufficient stock for ${itemName} (${variantName}). Only ${variant.stockQuantity || 0} remaining.` }, { status: 400 })
          }
        }
      } else {
        // Check stock for main product
        if (product.trackInventory && !product.allowOutOfStockPurchase) {
          if ((product.stockQuantity || 0) < item.quantity) {
             return NextResponse.json({ error: `Insufficient stock for ${itemName}. Only ${product.stockQuantity || 0} remaining.` }, { status: 400 })
          }
        }
      }

      const lineTotal = unitPrice * item.quantity
      subtotal += lineTotal

      orderItems.push({
        productId: product._id.toString(),
        variantId: item.variantId || null,
        name: itemName,
        variantName,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        image: product.images?.[0] || null,
      })
    }

    const shipping = 0 // Free standard shipping
    const tax = 0 // Included or calculated
    const total = subtotal + shipping + tax
    const now = new Date().toISOString()

    // Unique sequential/timestamped order ID
    const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`

    const orderDoc = {
      orderId,
      customerId,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        streetAddress: customer.streetAddress,
        city: customer.city,
        state: customer.state,
        pinCode: customer.pinCode,
      },
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      currency: "INR",
      orderStatus: "Pending",
      paymentStatus: "Pending",
      paymentMethod: "online_gateway_pending",
      createdAt: now,
      updatedAt: now,
    }

    await ordersCollection.insertOne(orderDoc)

    // 3. Deduct stock safely
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

    // 4. Save address to customer profile if requested
    if (customer.saveAddress) {
      const newAddress = {
        id: `addr_${Date.now()}`,
        fullName: customer.name,
        phone: customer.phone,
        streetAddress: customer.streetAddress,
        city: customer.city,
        state: customer.state,
        pinCode: customer.pinCode,
        isDefault: true,
      }
      
      await customersCollection.updateOne(
        { _id: new ObjectId(customerId) },
        { 
          $set: { "addresses.$[].isDefault": false }
        }
      )

      await customersCollection.updateOne(
        { _id: new ObjectId(customerId) },
        { 
          $push: { addresses: newAddress as unknown },
          $set: { phone: customer.phone, updatedAt: now }
        } as Parameters<typeof customersCollection.updateOne>[1]
      )
    }

    // 5. Audit log
    await logAudit({
      actor: `Customer:${auth.session.email}`,
      action: "ORDER_CREATED",
      entity: "Order",
      entityId: orderId,
      metadata: { total, itemCount: orderItems.length }
    })

    return NextResponse.json({ success: true, orderId })
  } catch (err) {
    console.error("Checkout processing error:", err)
    return NextResponse.json({ error: "Failed to process order checkout. Please try again." }, { status: 500 })
  }
}
