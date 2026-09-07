"use client"

import * as React from "react"
import { X, Upload, Plus, Trash2 } from "lucide-react"

export type Variant = {
  id: string
  name: string
  sku?: string
  price?: number
  stockQuantity: number
  attributes?: Record<string, string>
}

export type ProductFormData = {
  name: string
  shortDescription: string
  description: string
  category: string
  productType: string
  sku: string
  brand: string
  tags: string[]
  price: number
  compareAtPrice?: number
  stockQuantity: number
  trackInventory: boolean
  allowOutOfStockPurchase: boolean
  lowStockThreshold: number
  images: string[]
  variants: Variant[]
  status: "Draft" | "Published" | "Archived"
  isFeatured: boolean
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
  isPending: boolean
}

export function ProductForm({ initialData, onSubmit, onCancel, isPending }: ProductFormProps) {
  const [formData, setFormData] = React.useState<ProductFormData>({
    name: initialData?.name || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    category: initialData?.category || "Other",
    productType: initialData?.productType || "Standard",
    sku: initialData?.sku || "",
    brand: initialData?.brand || "",
    tags: initialData?.tags || [],
    price: initialData?.price || 0,
    compareAtPrice: initialData?.compareAtPrice,
    stockQuantity: initialData?.stockQuantity || 0,
    trackInventory: initialData?.trackInventory ?? true,
    allowOutOfStockPurchase: initialData?.allowOutOfStockPurchase ?? false,
    lowStockThreshold: initialData?.lowStockThreshold || 5,
    images: initialData?.images || [],
    variants: initialData?.variants || [],
    status: initialData?.status || "Draft",
    isFeatured: initialData?.isFeatured || false,
  })

  const [tagInput, setTagInput] = React.useState("")
  const [uploadingImage, setUploadingImage] = React.useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const data = new FormData()
    data.append("file", file)

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      })
      
      const json = await res.json()
      if (json.success) {
        setFormData(prev => ({ ...prev, images: [...prev.images, json.url] }))
      } else {
        alert(json.error || "Failed to upload image")
      }
    } catch (err) {
      console.error(err)
      alert("Error uploading image")
    } finally {
      setUploadingImage(false)
      // Reset input
      e.target.value = ""
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }))
  }

  const addVariant = () => {
    const newVariant: Variant = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Variant ${formData.variants.length + 1}`,
      stockQuantity: 0,
    }
    setFormData(prev => ({ ...prev, variants: [...prev.variants, newVariant] }))
  }

  const updateVariant = (index: number, updates: Partial<Variant>) => {
    setFormData(prev => {
      const newVariants = [...prev.variants]
      newVariants[index] = { ...newVariants[index], ...updates }
      return { ...prev, variants: newVariants }
    })
  }

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
        <h3 className="font-bold text-lg border-b border-border pb-2 mb-4">Basic Information</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Name *</label>
          <input
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Short Description</label>
          <input
            value={formData.shortDescription}
            onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Full Description *</label>
          <textarea
            required
            rows={5}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category *</label>
            <select
              required
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            >
              <option value="Books">Books</option>
              <option value="T-Shirts">T-Shirts</option>
              <option value="Merchandise">Merchandise</option>
              <option value="Digital Products">Digital Products</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Type</label>
            <input
              value={formData.productType}
              onChange={e => setFormData({ ...formData, productType: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Physical, Digital, Subscription"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SKU</label>
            <input
              value={formData.sku}
              onChange={e => setFormData({ ...formData, sku: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Brand</label>
            <input
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {formData.tags.map(tag => (
              <span key={tag} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            />
            <button type="button" onClick={addTag} className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">Add</button>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
        <h3 className="font-bold text-lg border-b border-border pb-2 mb-4">Pricing (INR)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Price (₹) *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Compare-at Price (₹)</label>
            <input
              type="number"
              min="0"
              value={formData.compareAtPrice || ""}
              onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
        <h3 className="font-bold text-lg border-b border-border pb-2 mb-4">Inventory</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={formData.stockQuantity}
              onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={formData.trackInventory}
              onChange={e => setFormData({ ...formData, trackInventory: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary/50"
            />
            Track Inventory
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allowOutOfStockPurchase}
              onChange={e => setFormData({ ...formData, allowOutOfStockPurchase: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary/50"
            />
            Allow Out of Stock Purchase
          </label>
        </div>
      </div>

      {/* Media */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
        <h3 className="font-bold text-lg border-b border-border pb-2 mb-4">Media</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {formData.images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-lg border border-border overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="Product" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
            {uploadingImage ? (
              <span className="text-sm text-muted-foreground animate-pulse">Uploading...</span>
            ) : (
              <>
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">Add Image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
          </label>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
          <h3 className="font-bold text-lg">Variants (Options)</h3>
          <button type="button" onClick={addVariant} className="flex items-center text-sm font-medium text-primary hover:text-primary/80">
            <Plus className="w-4 h-4 mr-1" /> Add Variant
          </button>
        </div>

        {formData.variants.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No variants added. This product has no options like size or color.</p>
        ) : (
          <div className="space-y-4">
            {formData.variants.map((variant, i) => (
              <div key={variant.id} className="p-4 border border-border rounded-lg bg-muted/30 relative">
                <button type="button" onClick={() => removeVariant(i)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pr-8">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Variant Name</label>
                    <input
                      value={variant.name}
                      onChange={e => updateVariant(i, { name: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">SKU</label>
                    <input
                      value={variant.sku || ""}
                      onChange={e => updateVariant(i, { sku: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Specific Price (₹)</label>
                    <input
                      type="number"
                      value={variant.price === undefined ? "" : variant.price}
                      onChange={e => updateVariant(i, { price: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Same as main"
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Stock</label>
                    <input
                      type="number"
                      value={variant.stockQuantity}
                      onChange={e => updateVariant(i, { stockQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publishing & Actions */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as "Draft" | "Published" | "Archived" })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div className="space-y-2 pt-8">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary/50"
              />
              Featured Product
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6 md:mt-0 pt-4 md:pt-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>
    </form>
  )
}
