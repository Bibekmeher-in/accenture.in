import React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import clientPromise from "@/lib/mongodb"
import { getCustomerSession } from "@/lib/customer-auth"
import { formatINR } from "@/lib/currency"
import { ArrowLeft, ShoppingBag, MapPin, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react"

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getCustomerSession()
  if (!session) return null

  const resolvedParams = await params
  const orderId = resolvedParams.id

  const client = await clientPromise
  const db = client.db("accenture")
  const order = await db.collection("orders").findOne({
    orderId,
    customerId: session.customerId,
  })

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
    : "Recent"

  return (
    <div className="space-y-8">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-border">
        <div>
          <Link
            href="/account/orders"
            className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all orders
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Order <span className="font-mono text-primary">{order.orderId}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Placed on {formattedDate}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
            Status: {order.orderStatus || "Pending"}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-lg font-bold text-foreground">Items in this order</h3>
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
                className="flex items-center gap-4 p-4 bg-muted/20 border border-border rounded-2xl"
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

          <div className="p-4 bg-muted/30 border border-border rounded-2xl flex items-start gap-3 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-foreground">Authoritative Order Record:</span> All product prices and order
              totals are authoritatively calculated and locked by the database at purchase time.
            </div>
          </div>
        </div>

        {/* Shipping & Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shipping Address */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Shipping Destination
            </h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">{order.customer?.name}</p>
              <p>{order.customer?.streetAddress}</p>
              <p>
                {order.customer?.city}, {order.customer?.state} {order.customer?.pinCode}
              </p>
              <p className="font-mono pt-1 text-foreground">Phone: {order.customer?.phone}</p>
              <p className="truncate">Email: {order.customer?.email}</p>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-foreground">Payment Summary</h4>
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
                <span>Tax</span>
                <span className="font-semibold text-foreground">Included</span>
              </div>
              <div className="flex justify-between text-base font-black pt-3 border-t border-border text-foreground">
                <span>Total (INR)</span>
                <span className="text-primary">{formatINR(order.total || 0)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <span>Encrypted order ownership verification</span>
          </div>
        </div>
      </div>
    </div>
  )
}
