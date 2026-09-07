"use client"

import React, { useState } from "react"
import { useCart } from "@/components/store/CartProvider"
import { Container } from "@/components/ui/Container"
import { formatINR } from "@/lib/currency"
import { useRouter } from "next/navigation"
import { ShieldCheck, CheckCircle2, ShoppingBag } from "lucide-react"

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderId, setOrderId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      alert("Your cart is empty")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: formData,
          items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity
          }))
        })
      })
      
      const json = await res.json()
      
      if (json.success) {
        setIsSuccess(true)
        setOrderId(json.orderId)
        clearCart()
      } else {
        alert(json.error || "Failed to process checkout")
      }
    } catch {
      alert("An error occurred during checkout")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background py-16">
        <Container>
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black">Order Placed!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for your order. We have received it and will process it shortly.
            </p>
            <div className="p-4 bg-muted rounded-xl border border-border font-mono text-sm">
              Order ID: <span className="font-bold text-foreground">{orderId}</span>
            </div>
            <button 
              onClick={() => router.push("/store")}
              className="mt-8 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Store
            </button>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-12">
      <Container>
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order securely.</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-muted/30 rounded-2xl border border-border">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Add some items from the store to proceed with checkout.</p>
            <button 
              onClick={() => router.push("/store")}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Store
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Form */}
            <div className="lg:col-span-7">
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">1</span>
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <input 
                        required type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <input 
                        required
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">2</span>
                    Shipping Address
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Street Address</label>
                      <input 
                        required
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">City</label>
                      <input 
                        required
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">State</label>
                      <input 
                        required
                        value={formData.state}
                        onChange={e => setFormData({...formData, state: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">PIN Code</label>
                      <input 
                        required
                        value={formData.pinCode}
                        onChange={e => setFormData({...formData, pinCode: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-muted/30 border border-border rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 items-start">
                      <div className="w-16 h-16 bg-muted rounded-lg border border-border flex-shrink-0 overflow-hidden relative">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute -top-2 -right-2 bg-foreground text-background w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm leading-tight">{item.name}</p>
                        {item.variantName && <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>}
                      </div>
                      <div className="font-medium text-sm">
                        {formatINR(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Taxes</span>
                    <span>Calculated at next step</span>
                  </div>
                  <div className="flex justify-between text-xl font-black pt-4 border-t border-border text-foreground">
                    <span>Total</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-xl p-4 mb-6 flex gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                  <p>Payments are currently processed manually. We will contact you regarding payment after you place the order.</p>
                </div>

                <button 
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? "Processing..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
