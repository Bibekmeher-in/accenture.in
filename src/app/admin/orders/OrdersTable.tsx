"use client"

import React, { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { Search, Eye, Filter, ArrowUpDown } from "lucide-react"
import { updateOrderStatus } from "./actions"
import { formatINR } from "@/lib/currency"
interface OrderRow {
  _id: string
  orderId: string
  customerId: string
  customer: {
    name: string
    email: string
    phone: string
  }
  itemsCount: number
  subtotal: number
  total: number
  currency: string
  orderStatus: string
  paymentStatus: string
  createdAt: string
}

export function OrdersTable({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest">("newest")
  const [isPending, startTransition] = useTransition()

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchesSearch =
          o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customer.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
          statusFilter === "all" || o.orderStatus.toLowerCase() === statusFilter.toLowerCase()

        const matchesPayment =
          paymentFilter === "all" || o.paymentStatus.toLowerCase() === paymentFilter.toLowerCase()

        return matchesSearch && matchesStatus && matchesPayment
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        if (sortBy === "highest") {
          return b.total - a.total
        }
        return 0
      })
  }, [orders, searchQuery, statusFilter, paymentFilter, sortBy])

  const handleStatusChange = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus)
      if (res.error) {
        alert(res.error)
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? { ...o, orderStatus: newStatus } : o))
        )
      }
    })
  }

  return (
    <div className="flex flex-col">
      {/* Controls */}
      <div className="p-4 sm:p-6 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5 text-xs">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="authorized">Authorized</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "highest")}
              className="bg-transparent text-foreground focus:outline-none font-medium cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground">
              <th className="py-3.5 px-4">Order Reference</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Items</th>
              <th className="py-3.5 px-4">Total</th>
              <th className="py-3.5 px-4">Order Status</th>
              <th className="py-3.5 px-4">Payment</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  No orders found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const formattedDate = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"

                return (
                  <tr key={order.orderId} className="hover:bg-muted/30 transition-colors">
                    {/* Order ID */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/orders/${order.orderId}`}
                        className="font-mono font-bold text-sm text-primary hover:underline"
                      >
                        {order.orderId}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div>
                        {order.customerId ? (
                          <Link
                            href={`/admin/customers/${order.customerId}`}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors block"
                          >
                            {order.customer.name}
                          </Link>
                        ) : (
                          <p className="font-bold text-sm text-foreground">{order.customer.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{formattedDate}</td>

                    {/* Items */}
                    <td className="py-3.5 px-4 text-xs font-medium">
                      {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 font-bold text-sm text-foreground">
                      {formatINR(order.total)}
                    </td>

                    {/* Order Status Select */}
                    <td className="py-3.5 px-4">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        disabled={isPending}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          order.orderStatus === "Delivered"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : order.orderStatus === "Shipped"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : order.orderStatus === "Processing"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            : order.orderStatus === "Cancelled"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Payment Status (Read-Only) */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          order.paymentStatus === "Paid"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : order.paymentStatus === "Authorized"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : order.paymentStatus === "Refunded"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            : order.paymentStatus === "Failed"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {order.paymentStatus || "Pending"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.orderId}`}
                        className="inline-flex items-center gap-1.5 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-xs font-semibold"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
