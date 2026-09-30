import React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { formatINR } from "@/lib/currency"
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag, MapPin, Globe, ShieldCheck, Briefcase } from "lucide-react"
import { CustomerStatusToggle } from "./CustomerStatusToggle"

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const customerId = resolvedParams.id

  if (!ObjectId.isValid(customerId)) {
    notFound()
  }

  const client = await clientPromise
  const db = client.db("accenture")

  const customer = await db.collection("customers").findOne(
    { _id: new ObjectId(customerId) },
    { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
  )

  if (!customer) {
    notFound()
  }

  const orders = await db
    .collection("orders")
    .find({ customerId })
    .sort({ createdAt: -1 })
    .toArray()

  const applications = await db
    .collection("careerApplications")
    .find({ $or: [{ customerId }, { email: customer.email }] })
    .sort({ createdAt: -1 })
    .toArray()

  const enrollments = await db
    .collection("enrollments")
    .find({ $or: [{ customerId }, { customerEmail: customer.email }] })
    .sort({ enrolledAt: -1 })
    .toArray()

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  const joinDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—"

  const lastLogin = customer.lastLoginAt
    ? new Date(customer.lastLoginAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-border">
        <div>
          <Link
            href="/admin/customers"
            className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all customers
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span>{customer.name}</span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                customer.status === "Active"
                  ? "bg-green-500/10 text-green-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {customer.status || "Active"}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">ID: {customerId}</p>
        </div>

        <CustomerStatusToggle customerId={customerId} currentStatus={customer.status || "Active"} />
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{orders.length}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Total Lifetime Value</p>
          <p className="text-2xl font-bold mt-1 text-primary">{formatINR(totalSpent)}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Joined Date</p>
          <p className="text-sm font-bold mt-2 text-foreground">{joinDate}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Last Active Login</p>
          <p className="text-sm font-bold mt-2 text-foreground">{lastLogin}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Profile & Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Profile & Contact
            </h3>
            <div className="text-xs space-y-3 pt-2">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{customer.phone || "No phone provided"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Registered on {joinDate}</span>
              </div>
            </div>
          </div>

          {/* Auth Providers */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Authentication Providers
            </h3>
            <div className="space-y-2 pt-1">
              {customer.authProviders?.map((prov: { provider: string; linkedAt?: string }, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-muted/40 rounded-xl text-xs">
                  <span className="font-bold text-foreground capitalize">{prov.provider}</span>
                  <span className="text-muted-foreground">
                    Linked {prov.linkedAt ? new Date(prov.linkedAt).toLocaleDateString("en-IN") : "Yes"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Saved Addresses ({customer.addresses?.length || 0})
            </h3>
            {(!customer.addresses || customer.addresses.length === 0) ? (
              <p className="text-xs text-muted-foreground italic">No addresses saved yet.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {customer.addresses.map((addr: { id: string; fullName: string; streetAddress: string; city: string; state: string; pinCode: string; phone: string; isDefault?: boolean }) => (
                  <div key={addr.id} className="p-3 bg-muted/40 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>{addr.fullName}</span>
                      {addr.isDefault && <span className="text-[10px] text-primary uppercase">Default</span>}
                    </div>
                    <p className="text-muted-foreground">{addr.streetAddress}</p>
                    <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.pinCode}</p>
                    <p className="text-muted-foreground font-mono">Phone: {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Orders */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" /> Order History ({orders.length})
            </h3>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                This customer has not placed any store orders yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Order Status</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {orders.map((order) => {
                      const orderDate = order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"

                      const itemCount = order.items?.reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity || 1), 0) || 0

                      return (
                        <tr key={order.orderId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-foreground">{order.orderId}</td>
                          <td className="py-3 px-3 text-muted-foreground">{orderDate}</td>
                          <td className="py-3 px-3">{itemCount} items</td>
                          <td className="py-3 px-3 font-bold text-foreground">{formatINR(order.total || 0)}</td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground uppercase">
                              {order.orderStatus || "Pending"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === "Paid" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                              {order.paymentStatus || "Pending"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/admin/orders/${order.orderId}`}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              Manage Order
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer Career Applications */}
          {applications.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Career Applications ({applications.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Date Applied</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {applications.map((app) => (
                      <tr key={app._id.toString()} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 font-semibold text-foreground">{app.roleTitle}</td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 uppercase">
                            {app.status || "Pending Review"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href="/admin/careers" className="text-xs font-bold text-primary hover:underline">
                            View in Careers
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customer Academy Enrollments */}
          {enrollments.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> Academy Enrollments ({enrollments.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Enrolled Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {enrollments.map((enr) => (
                      <tr key={enr._id.toString()} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 font-semibold text-foreground">{enr.courseTitle}</td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            enr.status === "Completed" ? "bg-green-500/10 text-green-600" :
                            enr.status === "Active" ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"
                          }`}>
                            {enr.status || "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/learning/${enr.courseSlug}`} target="_blank" className="text-xs font-bold text-primary hover:underline">
                            View Course
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            <span>Credentials, password hashes, and OAuth access tokens are never exposed to administrative interfaces.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
