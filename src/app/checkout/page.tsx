"use client"

import React, { useState, useEffect } from "react"
import { useCart } from "@/components/store/CartProvider"
import { Container } from "@/components/ui/Container"
import { formatINR } from "@/lib/currency"
import { useRouter } from "next/navigation"
import { ShieldCheck, CheckCircle2, ShoppingBag, ArrowRight, UserCheck, Plus, Check } from "lucide-react"
import { AuthModal } from "@/components/store/AuthModal"
import type { CustomerAddress } from "@/lib/customer-types"

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const router = useRouter()

  const [customerSession, setCustomerSession] = useState<{ customerId: string; email: string; name: string } | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new")
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true)
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    pinCode: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderId, setOrderId] = useState("")

  // Fetch session & profile
  useEffect(() => {
    async function loadCustomer() {
      try {
        const sessionRes = await fetch("/api/customer/session")
        const sessionData = await sessionRes.json()

        if (sessionData.authenticated && sessionData.session) {
          setCustomerSession(sessionData.session)
          
          // Fetch full customer details for saved addresses
          const { getCurrentCustomer } = await import("@/app/actions/customer-auth")
          const customerProfile = await getCurrentCustomer()

          if (customerProfile) {
            setFormData(prev => ({
              ...prev,
              name: customerProfile.name || prev.name,
              email: customerProfile.email || prev.email,
              phone: customerProfile.phone || prev.phone,
            }))

            if (customerProfile.addresses && customerProfile.addresses.length > 0) {
              setSavedAddresses(customerProfile.addresses)
              const defaultAddr = customerProfile.addresses.find(a => a.isDefault) || customerProfile.addresses[0]
              setSelectedAddressId(defaultAddr.id)
              setFormData(prev => ({
                ...prev,
                name: defaultAddr.fullName,
                phone: defaultAddr.phone,
                streetAddress: defaultAddr.streetAddress,
                city: defaultAddr.city,
                state: defaultAddr.state,
                pinCode: defaultAddr.pinCode,
              }))
            }
          }
        } else {
          setCustomerSession(null)
        }
      } catch (err) {
        console.error("Failed to load customer profile:", err)
      } finally {
        setIsLoadingCustomer(false)
      }
    }

    loadCustomer()
  }, [])

  const handleSelectAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id)
    setFormData(prev => ({
      ...prev,
      name: addr.fullName,
      phone: addr.phone,
      streetAddress: addr.streetAddress,
      city: addr.city,
      state: addr.state,
      pinCode: addr.pinCode,
    }))
  }

  const handleUseNewAddress = () => {
    setSelectedAddressId("new")
    setFormData(prev => ({
      ...prev,
      streetAddress: "",
      city: "",
      state: "",
      pinCode: "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerSession) {
      setIsAuthModalOpen(true)
      return
    }

    if (items.length === 0) {
      alert("Your cart is empty.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            ...formData,
            saveAddress: selectedAddressId === "new" ? saveAddressToAccount : false,
          },
          items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        setIsSuccess(true)
        setOrderId(json.orderId)
        clearCart()
      } else {
        alert(json.error || "Failed to process checkout. Please try again.")
      }
    } catch {
      alert("A network error occurred during checkout. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background py-16">
        <Container>
          <div className="max-w-lg mx-auto text-center space-y-6 bg-card border border-border p-8 sm:p-12 rounded-3xl shadow-xl">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-xs font-black tracking-widest text-green-600 bg-green-500/10 px-3 py-1 rounded-full uppercase">
              Order Confirmed
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground">Thank you for your order!</h1>
            <p className="text-muted-foreground text-base">
              Your order has been recorded in your account. You can track status and details anytime in your customer account portal.
            </p>
            <div className="p-4 bg-muted/60 rounded-2xl border border-border font-mono text-sm">
              Order ID: <span className="font-bold text-foreground">{orderId}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
              <button
                onClick={() => router.push("/account/orders")}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md"
              >
                View in My Orders
              </button>
              <button
                onClick={() => router.push("/store")}
                className="px-6 py-3 bg-muted text-foreground font-bold rounded-xl hover:bg-muted/80 transition-all border border-border"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-10">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectUrl="/checkout"
        onSuccess={() => {
          setIsAuthModalOpen(false)
          window.location.reload()
        }}
      />

      <Container>
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-foreground">Checkout</h1>
          <p className="text-muted-foreground">Review your order and complete your purchase securely.</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-border max-w-2xl mx-auto shadow-sm">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Add items from the store to proceed with checkout.</p>
            <button
              onClick={() => router.push("/store")}
              className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md"
            >
              Go to Store
            </button>
          </div>
        ) : !isLoadingCustomer && !customerSession ? (
          /* Unauthenticated Gate */
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                {items.reduce((sum, i) => sum + i.quantity, 0)} Items Saved in Cart
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3">Sign in to complete checkout</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Your cart is safely saved. Please sign in or create an account to finalize shipping and order details.
              </p>
            </div>

            <div className="p-4 bg-muted/40 rounded-2xl border border-border max-w-md mx-auto flex justify-between items-center text-sm font-semibold">
              <span className="text-muted-foreground">Cart Subtotal ({items.length} unique items):</span>
              <span className="text-lg font-bold text-foreground">{formatINR(subtotal)}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex-1 py-3.5 px-6 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
              >
                Sign In / Create Account <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Authentication required only for purchasing. No login required for browsing.</span>
            </div>
          </div>
        ) : (
          /* Authenticated Checkout Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Form Section */}
            <div className="lg:col-span-7">
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Customer Identification */}
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black mr-3">
                        1
                      </span>
                      Account & Contact
                    </h2>
                    {customerSession && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full font-bold">
                        <UserCheck className="w-3.5 h-3.5" /> Logged In
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Full Name</label>
                      <input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Email Address</label>
                      <input
                        required
                        type="email"
                        disabled
                        value={formData.email}
                        className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold">Phone Number</label>
                      <input
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Shipping Address */}
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black mr-3">
                      2
                    </span>
                    Shipping Address
                  </h2>

                  {/* Saved addresses selector */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Select Saved Address
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id
                          return (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectAddress(addr)}
                              className={`p-4 border rounded-xl cursor-pointer transition-all relative ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/40 bg-background"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-sm">{addr.fullName}</p>
                                {isSelected && (
                                  <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{addr.streetAddress}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {addr.city}, {addr.state} {addr.pinCode}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 font-mono">{addr.phone}</p>
                            </div>
                          )
                        })}

                        <div
                          onClick={handleUseNewAddress}
                          className={`p-4 border border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                            selectedAddressId === "new"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/40 text-muted-foreground"
                          }`}
                        >
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="text-xs font-bold">Use New Address</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address input fields */}
                  {(selectedAddressId === "new" || savedAddresses.length === 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold">Street Address</label>
                        <input
                          required
                          value={formData.streetAddress}
                          onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                          placeholder="House / Flat No., Street, Area"
                          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">City</label>
                        <input
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Mumbai, Bengaluru, etc."
                          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">State</label>
                        <input
                          required
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="Maharashtra, Karnataka, etc."
                          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold">PIN Code</label>
                        <input
                          required
                          value={formData.pinCode}
                          onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                          placeholder="400001"
                          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                        />
                      </div>

                      <div className="md:col-span-2 pt-2">
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveAddressToAccount}
                            onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                          />
                          <span>Save this shipping address to my account for faster checkout</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Order Summary & Submit */}
            <div className="lg:col-span-5">
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 sticky top-24 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 max-h-[35vh] overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId || "main"}`}
                      className="flex gap-4 items-start pb-4 border-b border-border/50 last:border-b-0 last:pb-0"
                    >
                      <div className="w-16 h-16 bg-muted rounded-xl border border-border flex-shrink-0 overflow-hidden relative">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm leading-tight line-clamp-2">{item.name}</p>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground mt-0.5">Variant: {item.variantName}</p>
                        )}
                      </div>
                      <div className="font-bold text-sm">{formatINR(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2.5 mb-6 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes</span>
                    <span className="font-semibold text-foreground">Included</span>
                  </div>
                  <div className="flex justify-between text-xl font-black pt-4 border-t border-border text-foreground">
                    <span>Total (INR)</span>
                    <span className="text-primary">{formatINR(subtotal)}</span>
                  </div>
                </div>

                <div className="bg-muted/40 border border-border rounded-xl p-4 mb-6 flex gap-3 text-xs text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                  <p>
                    Your order will be linked to your account. Payment is currently verified securely upon order confirmation.
                  </p>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-primary-foreground font-black text-base rounded-xl shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Processing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
