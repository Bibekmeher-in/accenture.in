import { Metadata } from "next"
import Link from "next/link"
import clientPromise from "@/lib/mongodb"
import {
  Users,
  LayoutTemplate,
  Clock,
  Target,
  CheckCircle2,
  ShoppingBag,
  UserCheck,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import { formatINR } from "@/lib/currency"

export const metadata: Metadata = {
  title: "Admin Dashboard | TEKNIXX",
}

function getThirtyDaysAgoIso() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString()
}

export default async function AdminDashboardPage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const thirtyDaysAgo = getThirtyDaysAgoIso()

  // 1. Pipeline Metrics
  const leadsCount = await db.collection("leads").countDocuments()
  const newLeadsCount = await db.collection("leads").countDocuments({ status: "new" })
  const openLeadsCount = await db.collection("leads").countDocuments({
    status: { $in: ["new", "assigned", "contacted", "qualified", "proposal", "negotiation"] },
  })

  // 2. Customer & Store Metrics
  const totalCustomers = await db.collection("customers").countDocuments()
  const activeCustomers = await db.collection("customers").countDocuments({ status: { $ne: "Disabled" } })
  const disabledCustomers = await db.collection("customers").countDocuments({ status: "Disabled" })
  const newCustomers30d = await db.collection("customers").countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  })

  const totalOrders = await db.collection("orders").countDocuments()
  const pendingOrders = await db.collection("orders").countDocuments({ orderStatus: "Pending" })
  const paidOrders = await db.collection("orders").countDocuments({ paymentStatus: "Paid" })

  const revenueAgg = await db.collection("orders").aggregate([
    { $match: { paymentStatus: "Paid" } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]).toArray()
  const paidRevenue = revenueAgg[0]?.total || 0

  // 3. Products & Learning Metrics
  const totalProducts = await db.collection("products").countDocuments()
  const publishedProducts = await db.collection("products").countDocuments({ status: "Published" })
  const totalCourses = await db.collection("learning").countDocuments()
  const publishedCourses = await db.collection("learning").countDocuments({ status: "Published" })

  // 4. Careers & Content Metrics
  const totalApplications = await db.collection("careerApplications").countDocuments()
  const pendingApplications = await db.collection("careerApplications").countDocuments({ status: "Pending Review" })
  const blogCount = await db.collection("blog").countDocuments()
  const portfolioCount = await db.collection("portfolio").countDocuments()
  const servicesCount = await db.collection("services").countDocuments()

  // 5. Recent Activities
  const recentOrders = await db.collection("orders").find({}).sort({ createdAt: -1 }).limit(5).toArray()
  const recentCustomers = await db
    .collection("customers")
    .find({}, { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray()
  const recentLeads = await db.collection("leads").find({}).sort({ createdAt: -1 }).limit(5).toArray()
  const recentAudit = await db.collection("auditLogs").find({}).sort({ timestamp: -1 }).limit(5).toArray()

  const storeStats = [
    {
      name: "Total Customers",
      value: totalCustomers,
      icon: UserCheck,
      desc: `${activeCustomers} active · ${disabledCustomers} disabled · ${newCustomers30d} new (30d)`,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/customers",
    },
    {
      name: "Total Store Orders",
      value: totalOrders,
      icon: ShoppingBag,
      desc: `${pendingOrders} pending fulfillment`,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/admin/orders",
    },
    {
      name: "Paid Revenue",
      value: formatINR(paidRevenue),
      icon: CheckCircle2,
      desc: `${paidOrders} paid orders`,
      color: "text-green-500",
      bg: "bg-green-500/10",
      href: "/admin/orders",
    },
    {
      name: "Store Products",
      value: totalProducts,
      icon: DollarSign,
      desc: `${publishedProducts} published in catalog`,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/admin/store",
    },
  ]

  const operationsStats = [
    {
      name: "Total Leads",
      value: leadsCount,
      icon: Users,
      desc: `${newLeadsCount} new · ${openLeadsCount} active in pipeline`,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/leads",
    },
    {
      name: "Career Applications",
      value: totalApplications,
      icon: Target,
      desc: `${pendingApplications} pending review`,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/admin/careers",
    },
    {
      name: "Learning Courses",
      value: totalCourses,
      icon: CheckCircle2,
      desc: `${publishedCourses} published modules`,
      color: "text-green-500",
      bg: "bg-green-500/10",
      href: "/admin/learning",
    },
    {
      name: "Content & Services",
      value: servicesCount,
      icon: LayoutTemplate,
      desc: `${servicesCount} services · ${blogCount} blogs · ${portfolioCount} projects`,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/services",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time metrics for customer accounts, store transactions, leads, and platform activity.
        </p>
      </div>

      {/* Store & Customer Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Store & Customer Metrics</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {storeStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.name}
                href={stat.href}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 shadow-sm transition-all block group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{stat.desc}</div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Operations & Pipeline Section */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Operations & Growth Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {operationsStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.name}
                href={stat.href}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 shadow-sm transition-all block group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{stat.desc}</div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Store Orders */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-primary" /> Recent Store Orders
            </h3>
            <Link href="/admin/orders" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl text-xs">
              No store orders placed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex justify-between items-center p-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors border border-border/40"
                >
                  <div>
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className="font-mono text-xs font-bold text-primary hover:underline"
                    >
                      {order.orderId}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.customer?.name || "Customer"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-foreground">{formatINR(order.total || 0)}</p>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-muted rounded-full">
                      {order.orderStatus || "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Customer Registrations */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-primary" /> Recent Customer Signups
            </h3>
            <Link href="/admin/customers" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          {recentCustomers.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl text-xs">
              No customer accounts registered yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentCustomers.map((cust) => (
                <div
                  key={cust._id.toString()}
                  className="flex justify-between items-center p-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors border border-border/40"
                >
                  <div>
                    <Link
                      href={`/admin/customers/${cust._id.toString()}`}
                      className="font-bold text-xs text-foreground hover:text-primary transition-colors"
                    >
                      {cust.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{cust.email}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        cust.status === "Active" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {cust.status || "Active"}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString("en-IN") : "Recent"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" /> Recent Leads
            </h3>
            <Link href="/admin/leads" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl text-xs">
              No leads yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div
                  key={lead._id.toString()}
                  className="flex justify-between items-center p-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors border border-border/40"
                >
                  <div>
                    <p className="font-bold text-xs text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full">
                    {lead.status || "new"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" /> System Activity
            </h3>
            <Link href="/admin/audit-logs" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          {recentAudit.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl text-xs">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentAudit.map((log) => (
                <div
                  key={log._id.toString()}
                  className="p-2.5 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors border border-border/40 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-foreground">
                      <span className="text-primary">{log.actor}</span>:{" "}
                      <span className="font-mono">{log.action}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.timestamp).toISOString().split("T")[0]}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] truncate mt-0.5">
                    {log.entity} {log.entityId ? `(${log.entityId.slice(0, 12)})` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
