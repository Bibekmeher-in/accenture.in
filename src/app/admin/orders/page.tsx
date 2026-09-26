import React from "react"
import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { OrdersTable } from "./OrdersTable"
import { ShoppingBag, Clock, CheckCircle2, DollarSign } from "lucide-react"
import { formatINR } from "@/lib/currency"

export const metadata: Metadata = {
  title: "Store Orders | Admin Portal",
}

export default async function AdminOrdersPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const ordersRaw = await db
    .collection("orders")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  const orders = ordersRaw.map((o) => ({
    _id: o._id.toString(),
    orderId: o.orderId,
    customerId: o.customerId || "",
    customer: {
      name: o.customer?.name || "Customer",
      email: o.customer?.email || "",
      phone: o.customer?.phone || "",
    },
    itemsCount: o.items?.reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity || 1), 0) || 0,
    subtotal: o.subtotal || 0,
    total: o.total || 0,
    currency: o.currency || "INR",
    orderStatus: o.orderStatus || "Pending",
    paymentStatus: o.paymentStatus || "Pending",
    createdAt: o.createdAt || new Date().toISOString(),
  }))

  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.orderStatus === "Pending").length
  const paidOrders = orders.filter((o) => o.paymentStatus === "Paid").length
  const pendingPayments = orders.filter((o) => o.paymentStatus === "Pending").length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Store Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer purchases, fulfillment progression, and payment confirmations.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">{totalOrders}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pending Fulfillment</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-600">{pendingOrders}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pending Payments</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-orange-600">{pendingPayments}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Confirmed Paid</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{paidOrders}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Store Order Value</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2 text-primary">{formatINR(totalRevenue)}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <OrdersTable initialOrders={orders} />
      </div>
    </div>
  )
}
