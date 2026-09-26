"use client"

import React, { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { Search, Eye, UserX, UserCheck, Trash2, Filter, ArrowUpDown } from "lucide-react"
import { toggleCustomerStatus, deleteCustomer } from "./actions"
import { formatINR } from "@/lib/currency"
import type { CustomerAuthProvider } from "@/lib/customer-types"

interface CustomerRow {
  _id: string
  name: string
  email: string
  phone: string
  authProviders: CustomerAuthProvider[]
  status: "Active" | "Disabled"
  createdAt: string
  lastLoginAt: string | null
  orderCount: number
  totalSpent: number
}

export function CustomersTable({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const [customers, setCustomers] = useState<CustomerRow[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [providerFilter, setProviderFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "lastLogin" | "orders" | "spent">("newest")
  const [isPending, startTransition] = useTransition()

  // Filter & Sort Logic
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesProvider =
          providerFilter === "all" ||
          c.authProviders?.some((p) => p.provider.toLowerCase() === providerFilter.toLowerCase())

        const matchesStatus =
          statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase()

        return matchesSearch && matchesProvider && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        if (sortBy === "lastLogin") {
          const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
          const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
          return bTime - aTime
        }
        if (sortBy === "orders") {
          return b.orderCount - a.orderCount
        }
        if (sortBy === "spent") {
          return b.totalSpent - a.totalSpent
        }
        return 0
      })
  }, [customers, searchQuery, providerFilter, statusFilter, sortBy])

  const handleToggleStatus = (id: string, currentStatus: "Active" | "Disabled") => {
    const newStatus = currentStatus === "Active" ? "Disabled" : "Active"
    const confirmText =
      newStatus === "Disabled"
        ? "Are you sure you want to disable this customer account? They will not be able to log in or purchase."
        : "Re-enable this customer account?"

    if (confirm(confirmText)) {
      startTransition(async () => {
        const res = await toggleCustomerStatus(id, newStatus)
        if (res.error) {
          alert(res.error)
        } else {
          setCustomers((prev) =>
            prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
          )
        }
      })
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete or deactivate customer "${name}"? If they have existing orders, their order history will be safely preserved.`
      )
    ) {
      startTransition(async () => {
        const res = await deleteCustomer(id)
        if (res.error) {
          alert(res.error)
        } else {
          if (res.message) {
            alert(res.message)
          }
          window.location.reload()
        }
      })
    }
  }

  return (
    <div className="flex flex-col">
      {/* Search & Filter Controls */}
      <div className="p-4 sm:p-6 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">All Providers</option>
              <option value="email">Email Auth</option>
              <option value="google">Google OAuth</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "oldest" | "lastLogin" | "orders" | "spent")
              }
              className="bg-transparent text-foreground focus:outline-none font-medium cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="lastLogin">Recent Login</option>
              <option value="orders">Most Orders</option>
              <option value="spent">Highest Spend</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground">
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Provider</th>
              <th className="py-3.5 px-4">Joined Date</th>
              <th className="py-3.5 px-4">Last Login</th>
              <th className="py-3.5 px-4 text-center">Orders</th>
              <th className="py-3.5 px-4">Total Spent</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  No customers found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => {
                const joinDate = customer.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"

                const lastLoginDate = customer.lastLoginAt
                  ? new Date(customer.lastLoginAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Never"

                const hasGoogle = customer.authProviders?.some((p) => p.provider === "google")
                const hasEmail = customer.authProviders?.some((p) => p.provider === "email")

                return (
                  <tr
                    key={customer._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {customer.name ? customer.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground leading-tight">
                            {customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{customer.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Auth Providers */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {hasGoogle && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-semibold flex items-center gap-1">
                            Google
                          </span>
                        )}
                        {hasEmail && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-foreground font-semibold">
                            Email
                          </span>
                        )}
                        {!hasGoogle && !hasEmail && (
                          <span className="text-[11px] text-muted-foreground">Standard</span>
                        )}
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{joinDate}</td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{lastLoginDate}</td>

                    {/* Order Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-sm bg-muted/60 px-2.5 py-1 rounded-lg">
                        {customer.orderCount}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="py-3.5 px-4 font-bold text-sm text-foreground">
                      {formatINR(customer.totalSpent)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          customer.status === "Active"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/customers/${customer._id}`}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="View customer details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleToggleStatus(customer._id, customer.status)}
                          disabled={isPending}
                          className={`p-1.5 rounded-lg transition-colors ${
                            customer.status === "Active"
                              ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                              : "text-muted-foreground hover:text-green-600 hover:bg-green-500/10"
                          }`}
                          title={customer.status === "Active" ? "Disable account" : "Enable account"}
                        >
                          {customer.status === "Active" ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(customer._id, customer.name)}
                          disabled={isPending}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete / Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
