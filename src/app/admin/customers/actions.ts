"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function toggleCustomerStatus(customerId: string, newStatus: "Active" | "Disabled") {
  try {
    const adminSession = await getSession()
    if (!adminSession) return { error: "Unauthorized" }

    if (!ObjectId.isValid(customerId)) {
      return { error: "Invalid customer ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })

    if (!customer) return { error: "Customer not found" }

    await db.collection("customers").updateOne(
      { _id: new ObjectId(customerId) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: adminSession.username,
      action: newStatus === "Active" ? "CUSTOMER_ENABLED" : "CUSTOMER_DISABLED",
      entity: "Customer",
      entityId: customerId,
      metadata: { customerEmail: customer.email, newStatus }
    })

    revalidatePath("/admin/customers")
    revalidatePath(`/admin/customers/${customerId}`)
    return { success: true }
  } catch (err) {
    console.error("toggleCustomerStatus error:", err)
    return { error: "Failed to update customer status" }
  }
}

export async function deleteCustomer(customerId: string) {
  try {
    const adminSession = await getSession()
    if (!adminSession) return { error: "Unauthorized" }

    if (!ObjectId.isValid(customerId)) {
      return { error: "Invalid customer ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })

    if (!customer) return { error: "Customer not found" }

    // Check if customer has orders
    const orderCount = await db.collection("orders").countDocuments({ customerId })

    if (orderCount > 0) {
      // Safe deactivation / anonymization strategy to preserve historical orders
      await db.collection("customers").updateOne(
        { _id: new ObjectId(customerId) },
        {
          $set: {
            status: "Disabled",
            name: `${customer.name} (Deactivated)`,
            updatedAt: new Date().toISOString(),
          },
          $unset: {
            passwordHash: "",
            resetPasswordToken: "",
          }
        }
      )

      await logAudit({
        actor: adminSession.username,
        action: "CUSTOMER_DEACTIVATED_PRESERVED_ORDERS",
        entity: "Customer",
        entityId: customerId,
        metadata: { customerEmail: customer.email, ordersPreserved: orderCount }
      })

      revalidatePath("/admin/customers")
      return { 
        success: true, 
        message: `Account deactivated. Order history (${orderCount} orders) has been safely preserved.` 
      }
    }

    // No orders, can safely remove
    await db.collection("customers").deleteOne({ _id: new ObjectId(customerId) })

    await logAudit({
      actor: adminSession.username,
      action: "CUSTOMER_DELETED",
      entity: "Customer",
      entityId: customerId,
      metadata: { deletedEmail: customer.email }
    })

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (err) {
    console.error("deleteCustomer error:", err)
    return { error: "Failed to delete customer" }
  }
}

export async function updateCustomerNotes(customerId: string, notes: string) {
  try {
    const adminSession = await getSession()
    if (!adminSession) return { error: "Unauthorized" }

    if (!ObjectId.isValid(customerId)) {
      return { error: "Invalid customer ID" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("customers").updateOne(
      { _id: new ObjectId(customerId) },
      {
        $set: {
          adminNotes: notes.trim(),
          updatedAt: new Date().toISOString(),
        }
      }
    )

    await logAudit({
      actor: adminSession.username,
      action: "CUSTOMER_NOTES_UPDATED",
      entity: "Customer",
      entityId: customerId,
    })

    revalidatePath(`/admin/customers/${customerId}`)
    return { success: true }
  } catch (err) {
    console.error("updateCustomerNotes error:", err)
    return { error: "Failed to update customer notes" }
  }
}
