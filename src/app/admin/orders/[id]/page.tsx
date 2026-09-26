import React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import clientPromise from "@/lib/mongodb"
import { formatINR } from "@/lib/currency"
import { ArrowLeft, ShoppingBag, MapPin, User, Calendar, ShieldCheck, Mail, Phone } from "lucide-react"
import { OrderControlPanel } from "./OrderControlPanel"

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const orderId = resolvedParams.id

  const client = await clientPromise
  const db = client.db("accenture")
  const order = await db.collection("orders").findOne({ orderId })

  if (!order) {
    notFound()
  }

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-border">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all orders
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span>Order</span>
            <span className="font-mono text-primary">{order.orderId}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Placed on {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
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
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
              order.paymentStatus === "Paid"
                ? "bg-green-500/10 text-green-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Payment: {order.paymentStatus || "Pending"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content: Items & Financials */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-foreground">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item: {
                productId: string
                name: string
                variantName?: string
                quantity: number
                unitPrice: number
                lineTotal: number
                image?: string
              }, idx: number) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="flex items-center gap-4 p-4 bg-muted/20 border border-border rounded-xl"
                >
                  <div className="w-16 h-16 bg-muted rounded-xl border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{item.name}</p>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground mt-0.5">Variant: {item.variantName}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Qty: {item.quantity} × {formatINR(item.unitPrice)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-foreground">{formatINR(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Control Actions */}
          <OrderControlPanel
            orderId={order.orderId}
            currentStatus={order.orderStatus || "Pending"}
            currentPayment={order.paymentStatus || "Pending"}
            paymentMethod={order.paymentMethod}
            manualPaymentInfo={order.manualPaymentInfo}
            refundInfo={order.refundInfo}
          />
        </div>

        {/* Sidebar: Customer & Shipping */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Overview */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Customer Account
              </h3>
              {order.customerId && (
                <Link
                  href={`/admin/customers/${order.customerId}`}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View Profile
                </Link>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-2 pt-1">
              <p className="font-bold text-foreground text-sm">{order.customer?.name}</p>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>{order.customer?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <span className="font-mono">{order.customer?.phone || "No phone"}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Delivery Destination
            </h3>
            <div className="text-xs text-muted-foreground space-y-1 pt-1">
              <p className="font-bold text-foreground">{order.customer?.name}</p>
              <p>{order.customer?.streetAddress}</p>
              <p>
                {order.customer?.city}, {order.customer?.state} {order.customer?.pinCode}
              </p>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-foreground">Order Breakdown</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">{formatINR(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxes</span>
                <span className="font-semibold text-foreground">Included</span>
              </div>
              <div className="flex justify-between text-base font-black pt-3 border-t border-border text-foreground">
                <span>Total (INR)</span>
                <span className="text-primary">{formatINR(order.total || 0)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            <span>Authorized store order record linked to customer account.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
