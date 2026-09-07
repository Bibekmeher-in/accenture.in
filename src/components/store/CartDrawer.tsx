"use client"

import React from "react"
import { useCart } from "./CartProvider"
import { formatINR } from "@/lib/currency"
import { X, ShoppingBag, Plus, Minus, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeItem, subtotal, totalItems } = useCart()
  const router = useRouter()

  if (!isCartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-primary" /> 
            Your Cart ({totalItems})
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
              <p>Your cart is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId || 'main'}`} className="flex gap-4 border border-border p-3 rounded-xl bg-background/50 relative group">
                <button 
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="Remove item"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h4 className="font-bold text-sm leading-tight line-clamp-2">{item.name}</h4>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground mt-0.5">Variant: {item.variantName}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="p-1 hover:bg-muted text-muted-foreground transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        className="p-1 hover:bg-muted text-muted-foreground transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-sm">{formatINR(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/10">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold text-lg">{formatINR(subtotal)}</span>
            </div>
            <button 
              onClick={() => {
                setIsCartOpen(false)
                router.push("/checkout")
              }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              Checkout <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
