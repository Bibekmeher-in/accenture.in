"use server"

import { revalidatePath } from "next/cache"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function updateOrderStatus(orderId: string, orderStatus: string) {
  try {
    const adminSession = await getSession()
    if (!adminSession) return { error: "Unauthorized" }

    const validStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"]
    if (!validStatuses.includes(orderStatus)) {
      return { error: "Invalid order status." }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const order = await db.collection("orders").findOne({ orderId })

    if (!order) return { error: "Order not found." }

    await db.collection("orders").updateOne(
      { orderId },
      {
        $set: {
          orderStatus,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: adminSession.username,
      action: "ORDER_STATUS_UPDATED",
      entity: "Order",
      entityId: orderId,
      metadata: { previousStatus: order.orderStatus, newStatus: orderStatus }
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    return { success: true }
  } catch (err) {
    console.error("updateOrderStatus error:", err)
    return { error: "Failed to update order status." }
  }
}

export async function recordManualOfflinePayment(
  orderId: string,
  data: { channel: string; reference: string; notes?: string }
) {
  try {
    const adminSession = await getSession()
    if (!adminSession) return { error: "Unauthorized. Admin session required." }

    if (!data.channel || !data.channel.trim()) {
      return { error: "Payment channel/method is required (e.g., Bank Transfer, COD)." }
    }
    if (!data.reference || !data.reference.trim()) {
      return { error: "Payment transaction or receipt reference number is required." }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const order = await db.collection("orders").findOne({ orderId })

    if (!order) return { error: "Order not found." }

    const now = new Date().toISOString()
    const manualPaymentInfo = {
      channel: data.channel.trim(),
      reference: data.reference.trim(),
      notes: data.notes?.trim() || "",
      recordedBy: adminSession.username,
      recordedAt: now,
    }

    await db.collection("orders").updateOne(
      { orderId },
      {
        $set: {
          paymentStatus: "Paid",
          paymentMethod: "manual_offline",
          manualPaymentInfo,
          updatedAt: now,
        }
      }
    )

    await logAudit({
      actor: adminSession.username,
      action: "ORDER_PAYMENT_MANUAL_RECORDED",
      entity: "Order",
      entityId: orderId,
      metadata: {
        previousPaymentStatus: order.paymentStatus,
        total: order.total,
        channel: data.channel.trim(),
        reference: data.reference.trim(),
        notes: data.notes?.trim(),
      }
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    return { success: true }
  } catch (err) {
    console.error("recordManualOfflinePayment error:", err)
    return { error: "Failed to record manual offline payment." }
  }
}

export async function recordPaymentRefund(
  orderId: string,
  data: { reason: string; reference?: string }
) {
  try {
    const adminSession = await getSession()
    if (!adminSession) return { error: "Unauthorized. Admin session required." }

    if (!data.reason || !data.reason.trim()) {
      return { error: "Refund justification/reason is required." }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const order = await db.collection("orders").findOne({ orderId })

    if (!order) return { error: "Order not found." }

    const now = new Date().toISOString()
    const refundInfo = {
      reason: data.reason.trim(),
      reference: data.reference?.trim() || "",
      refundedBy: adminSession.username,
      refundedAt: now,
    }

    await db.collection("orders").updateOne(
      { orderId },
      {
        $set: {
          paymentStatus: "Refunded",
          refundInfo,
          updatedAt: now,
        }
      }
    )

    await logAudit({
      actor: adminSession.username,
      action: "ORDER_PAYMENT_REFUNDED",
      entity: "Order",
      entityId: orderId,
      metadata: {
        previousPaymentStatus: order.paymentStatus,
        reason: data.reason.trim(),
        reference: data.reference?.trim(),
      }
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    return { success: true }
  } catch (err) {
    console.error("recordPaymentRefund error:", err)
    return { error: "Failed to record refund." }
  }
}
