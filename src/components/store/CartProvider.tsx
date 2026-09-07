"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  variantId?: string
  variantName?: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  subtotal: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  totalItems: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("teknixx_cart")
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(stored))
      }
    } catch {
      console.error("Failed to parse cart from local storage")
    }
    // Set isMounted inside setTimeout to avoid cascading renders warning, or just set it
    // Wait, let's just set it outside try-catch
    setIsMounted(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("teknixx_cart", JSON.stringify(items))
    }
  }, [items, isMounted])

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variantId === item.variantId)
      if (existing) {
        return prev.map(i => 
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { ...item, quantity }]
    })
    setIsCartOpen(true)
  }

  const removeItem = (productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)))
  }

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId)
      return
    }
    setItems(prev => prev.map(i => 
      i.productId === productId && i.variantId === variantId
        ? { ...i, quantity }
        : i
    ))
  }

  const clearCart = () => {
    setItems([])
  }

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      isCartOpen,
      setIsCartOpen,
      totalItems
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
