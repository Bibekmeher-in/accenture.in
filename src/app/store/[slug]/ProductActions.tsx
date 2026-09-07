"use client"

import React, { useState } from "react"
import { useCart } from "@/components/store/CartProvider"
import { useRouter } from "next/navigation"
import { ShoppingCart, Zap, Check } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductActions({ product }: { product: any }) {
  const { addItem, setIsCartOpen } = useCart()
  const router = useRouter()
  
  const hasVariants = product.variants && product.variants.length > 0
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    hasVariants ? product.variants[0].id : undefined
  )
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const selectedVariant = hasVariants 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? product.variants.find((v: any) => v.id === selectedVariantId)
    : null

  // Check stock
  let isOutOfStock = false
  if (product.trackInventory && !product.allowOutOfStockPurchase) {
    if (hasVariants) {
      isOutOfStock = selectedVariant ? selectedVariant.stockQuantity <= 0 : true
    } else {
      isOutOfStock = product.stockQuantity <= 0
    }
  }

  const currentPrice = selectedVariant && selectedVariant.price !== undefined 
    ? selectedVariant.price 
    : product.price

  const handleAddToCart = () => {
    addItem({
      productId: product._id.toString(),
      name: product.name,
      price: currentPrice,
      image: product.images?.[0],
      variantId: selectedVariantId,
      variantName: selectedVariant?.name
    }, quantity)
    
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const handleBuyNow = () => {
    // Add to cart and immediately open checkout
    addItem({
      productId: product._id.toString(),
      name: product.name,
      price: currentPrice,
      image: product.images?.[0],
      variantId: selectedVariantId,
      variantName: selectedVariant?.name
    }, quantity)
    
    setIsCartOpen(false)
    router.push("/checkout")
  }

  return (
    <div className="space-y-6">
      {hasVariants && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Option</label>
          <div className="flex flex-wrap gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {product.variants.map((variant: any) => {
              const isVariantOutOfStock = product.trackInventory && !product.allowOutOfStockPurchase && variant.stockQuantity <= 0
              
              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  disabled={isVariantOutOfStock}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all
                    ${selectedVariantId === variant.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border hover:border-primary/50 text-foreground'}
                    ${isVariantOutOfStock ? 'opacity-50 cursor-not-allowed line-through' : ''}
                  `}
                >
                  {variant.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity</label>
          <select 
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="h-12 px-4 bg-background border border-border rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 h-12 rounded-lg font-bold flex items-center justify-center transition-all ${
              isOutOfStock 
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : justAdded
                  ? 'bg-green-500 text-white'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            {isOutOfStock ? (
              "Out of Stock"
            ) : justAdded ? (
              <><Check className="w-5 h-5 mr-2" /> Added</>
            ) : (
              <><ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart</>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`flex-1 h-12 rounded-lg font-bold flex items-center justify-center transition-all ${
              isOutOfStock
                ? 'bg-muted text-muted-foreground cursor-not-allowed hidden'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <Zap className="w-5 h-5 mr-2" /> Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}
