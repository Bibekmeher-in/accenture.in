"use client"

import React, { useState, useTransition } from "react"
import { Plus, Edit2, Trash2, CheckCircle2, MapPin, AlertCircle, X } from "lucide-react"
import { saveCustomerAddress, deleteCustomerAddress, setDefaultAddress } from "@/app/actions/customer-auth"
import type { CustomerAddress } from "@/lib/customer-types"

export function AddressManager({ initialAddresses }: { initialAddresses: CustomerAddress[] }) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses)
  const [editingAddress, setEditingAddress] = useState<Partial<CustomerAddress> | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleOpenNew = () => {
    setEditingAddress({
      fullName: "",
      phone: "",
      streetAddress: "",
      city: "",
      state: "",
      pinCode: "",
      isDefault: addresses.length === 0,
    })
    setIsFormOpen(true)
    setErrorMessage(null)
  }

  const handleOpenEdit = (addr: CustomerAddress) => {
    setEditingAddress(addr)
    setIsFormOpen(true)
    setErrorMessage(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAddress) return
    setErrorMessage(null)

    startTransition(async () => {
      const res = await saveCustomerAddress(editingAddress)
      if (res.error) {
        setErrorMessage(res.error)
      } else {
        setSuccessMessage("Address saved successfully.")
        setIsFormOpen(false)
        setEditingAddress(null)
        window.location.reload()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      startTransition(async () => {
        const res = await deleteCustomerAddress(id)
        if (res.error) {
          setErrorMessage(res.error)
        } else {
          setAddresses((prev) => prev.filter((a) => a.id !== id))
          setSuccessMessage("Address deleted.")
        }
      })
    }
  }

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      const res = await setDefaultAddress(id)
      if (res.error) {
        setErrorMessage(res.error)
      } else {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        )
        setSuccessMessage("Default address updated.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-600 dark:text-green-400 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Address Form Dialog / Card */}
      {isFormOpen && editingAddress && (
        <div className="p-6 bg-card border border-primary/40 ring-2 ring-primary/10 rounded-2xl space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <h3 className="font-bold text-base text-foreground">
              {editingAddress.id ? "Edit Address" : "Add New Address"}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Full Name</label>
                <input
                  required
                  value={editingAddress.fullName || ""}
                  onChange={(e) => setEditingAddress({ ...editingAddress, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Phone Number</label>
                <input
                  required
                  value={editingAddress.phone || ""}
                  onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Street Address</label>
              <input
                required
                value={editingAddress.streetAddress || ""}
                onChange={(e) => setEditingAddress({ ...editingAddress, streetAddress: e.target.value })}
                placeholder="House / Flat No., Street, Area"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">City</label>
                <input
                  required
                  value={editingAddress.city || ""}
                  onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">State</label>
                <input
                  required
                  value={editingAddress.state || ""}
                  onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">PIN Code</label>
                <input
                  required
                  value={editingAddress.pinCode || ""}
                  onChange={(e) => setEditingAddress({ ...editingAddress, pinCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingAddress.isDefault ?? false}
                  onChange={(e) => setEditingAddress({ ...editingAddress, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span>Set as default shipping address</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Add Address Card */}
        <button
          onClick={handleOpenNew}
          className="p-6 border-2 border-dashed border-border hover:border-primary rounded-2xl flex flex-col items-center justify-center text-center gap-2 text-muted-foreground hover:text-primary transition-all min-h-[160px] bg-muted/10 hover:bg-primary/5"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-sm">Add New Address</span>
          <span className="text-xs text-muted-foreground">Save another shipping destination</span>
        </button>

        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-5 bg-card border rounded-2xl transition-all shadow-sm flex flex-col justify-between ${
              addr.isDefault ? "border-primary ring-1 ring-primary/30" : "border-border"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  {addr.fullName}
                </span>
                {addr.isDefault && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    Default
                  </span>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                <p>{addr.streetAddress}</p>
                <p>
                  {addr.city}, {addr.state} {addr.pinCode}
                </p>
                <p className="font-mono pt-1 text-foreground">Phone: {addr.phone}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/60 text-xs">
              {!addr.isDefault ? (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  disabled={isPending}
                  className="text-primary hover:underline font-semibold"
                >
                  Set as default
                </button>
              ) : (
                <span className="text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Default Address
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(addr)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  title="Edit address"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
