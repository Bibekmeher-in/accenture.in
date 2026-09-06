"use client"

import * as React from "react"
import { createProduct, updateProduct, deleteProduct } from "./actions"
import { Store, Plus, Edit, Trash2, X } from "lucide-react"

export type Product = {
  _id: string
  title: string
  description: string
  price: number
  isPublished: boolean
  imageRef: string
}

export function StoreManager({ initialProducts: products }: { initialProducts: Product[] }) {
  const [isPending, startTransition] = React.useTransition()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    price: 0,
    isPublished: false,
    imageRef: ""
  })

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price,
        isPublished: product.isPublished,
        imageRef: product.imageRef || ""
      })
    } else {
      setEditingProduct(null)
      setFormData({
        title: "",
        description: "",
        price: 0,
        isPublished: false,
        imageRef: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const payload = {
        ...formData,
        isPublished: formData.isPublished
      }

      let res
      if (editingProduct) {
        res = await updateProduct(editingProduct._id, payload)
      } else {
        res = await createProduct(payload)
      }

      if (res.error) {
        alert(res.error)
      } else {
        setIsModalOpen(false)
        window.location.reload()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      startTransition(async () => {
        const res = await deleteProduct(id)
        if (res.error) {
          alert(res.error)
        } else {
          window.location.reload()
        }
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
        <h2 className="text-lg font-semibold flex items-center">
          <Store className="w-5 h-5 mr-2 text-primary" /> Store Catalog
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No products found in the catalog.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product._id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight">{product.title}</h3>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handleOpenModal(product)} className="p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product._id)} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xl font-bold text-foreground mb-3">${product.price.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground flex-1 line-clamp-3 mb-4">{product.description}</p>

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${product.isPublished ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    {product.isPublished ? "Published" : "Draft"}
                  </span>
                  {product.imageRef && (
                    <span className="text-xs text-muted-foreground border border-border px-2 py-1 rounded truncate max-w-[150px]">
                      {product.imageRef}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingProduct ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (USD) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Image Reference</label>
                  <input
                    type="text"
                    value={formData.imageRef}
                    onChange={e => setFormData({...formData, imageRef: e.target.value})}
                    placeholder="e.g. /uploads/image.jpg"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={e => setFormData({...formData, isPublished: e.target.checked})}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                />
                <label htmlFor="isPublished" className="text-sm font-medium cursor-pointer">
                  Publish to live store
                </label>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
