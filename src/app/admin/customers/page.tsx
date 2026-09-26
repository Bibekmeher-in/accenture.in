import React from "react"
import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { CustomersTable } from "./CustomersTable"
import { Users, UserCheck, ShieldAlert, ShoppingCart } from "lucide-react"

export const metadata: Metadata = {
  title: "Customers | Admin Portal",
}

export default async function AdminCustomersPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  // Fetch all customers (excluding password hashes and tokens)
  const customersRaw = await db
    .collection("customers")
    .find({}, { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } })
    .sort({ createdAt: -1 })
    .toArray()

  // Aggregate order counts and total spent per customer
  const ordersAgg = await db.collection("orders").aggregate([
    {
      $group: {
        _id: "$customerId",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: "$total" },
      }
    }
  ]).toArray()

  const orderStatsMap = new Map<string, { orderCount: number; totalSpent: number }>()
  ordersAgg.forEach(stat => {
    if (stat._id) {
      orderStatsMap.set(stat._id.toString(), {
        orderCount: stat.orderCount || 0,
        totalSpent: stat.totalSpent || 0,
      })
    }
  })

  const customers = customersRaw.map(c => {
    const customerId = c._id.toString()
    const stats = orderStatsMap.get(customerId) || { orderCount: 0, totalSpent: 0 }

    return {
      _id: customerId,
      name: c.name || "Customer",
      email: c.email || "",
      phone: c.phone || "",
      authProviders: c.authProviders || [],
      status: (c.status || "Active") as "Active" | "Disabled",
      createdAt: c.createdAt || new Date().toISOString(),
      lastLoginAt: c.lastLoginAt || null,
      orderCount: stats.orderCount,
      totalSpent: stats.totalSpent,
    }
  })

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === "Active").length
  const disabledCustomers = customers.filter(c => c.status === "Disabled").length
  const customersWithOrders = customers.filter(c => c.orderCount > 0).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor registered customers, authentication providers, order volumes, and account states.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Customers</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">{totalCustomers}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Active Accounts</span>
            <UserCheck className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{activeCustomers}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Disabled Accounts</span>
            <ShieldAlert className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold mt-2 text-destructive">{disabledCustomers}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Purchasing Customers</span>
            <ShoppingCart className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-600">{customersWithOrders}</p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <CustomersTable initialCustomers={customers} />
      </div>
    </div>
  )
}
