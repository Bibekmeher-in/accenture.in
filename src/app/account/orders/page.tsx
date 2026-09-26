import React from "react"
import Link from "next/link"
import clientPromise from "@/lib/mongodb"
import { getCustomerSession } from "@/lib/customer-auth"
import { formatINR } from "@/lib/currency"
import { ShoppingBag, ArrowRight, Eye, Calendar, Package } from "lucide-react"

export default async function CustomerOrdersPage() {
  const session = await getCustomerSession()
  if (!session) return null

  const client = await clientPromise
  const db = client.db("accenture")
  const orders = await db
    .collection("orders")
    .find({ customerId: session.customerId })
    .sort({ createdAt: -1 })
    .toArray()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Order History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track and view details of all your past and current purchases.
          </p>
        </div>
        <Link
          href="/store"
          className="inline-flex items-center text-sm font-bold text-primary hover:underline gap-1.5 self-start sm:self-auto"
        >
          Browse Store <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No orders placed yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Browse our store for professional tools, software architecture services, and merchandise.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const formattedDate = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Recent"

            const totalItems = order.items?.reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity || 1), 0) || 0

            return (
              <div
                key={order.orderId || order._id.toString()}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-foreground">{order.orderId}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        order.orderStatus === "Delivered"
                          ? "bg-green-500/10 text-green-600"
                          : order.orderStatus === "Shipped"
                          ? "bg-blue-500/10 text-blue-600"
                          : order.orderStatus === "Processing"
                          ? "bg-purple-500/10 text-purple-600"
                          : order.orderStatus === "Cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {order.orderStatus || "Pending"}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        order.paymentStatus === "Paid"
                          ? "bg-green-500/10 text-green-600 font-bold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Payment: {order.paymentStatus || "Pending"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {order.items?.map((i: { name: string; quantity: number }) => `${i.name} (x${i.quantity})`).join(", ")}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-muted-foreground">Order Total</p>
                    <p className="text-lg font-black text-foreground">{formatINR(order.total || 0)}</p>
                  </div>

                  <Link
                    href={`/account/orders/${order.orderId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-colors"
                  >
                    <Eye className="w-4 h-4" /> View Order
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
