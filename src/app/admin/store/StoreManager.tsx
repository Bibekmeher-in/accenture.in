"use client"

import * as React from "react"
import { createProduct, updateProduct, deleteProduct, archiveProduct } from "./actions"
import { Store, Plus, Edit, Trash2, Box, ArrowLeft, Eye, Archive } from "lucide-react"
import { ProductForm, ProductFormData } from "./ProductForm"
import { formatINR } from "@/lib/currency"

export type StoreManagerProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialProducts: any[]
}

export function StoreManager({ initialProducts: products }: StoreManagerProps) {
  const [isPending, startTransition] = React.useTransition()
  const [view, setView] = React.useState<"list" | "form">("list")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingProduct, setEditingProduct] = React.useState<any | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenForm = (product?: any) => {
    if (product) {
      setEditingProduct(product)
    } else {
      setEditingProduct(null)
    }
    setView("form")
  }

  const handleCloseForm = () => {
    setView("list")
    setEditingProduct(null)
  }

  const handleSubmit = (data: ProductFormData) => {
    startTransition(async () => {
      let res
      if (editingProduct) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res = await updateProduct(editingProduct._id as string, data as any)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res = await createProduct(data as any)
      }

      if (res.error) {
        alert(res.error)
      } else {
        handleCloseForm()
        window.location.reload()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this product? Consider archiving it instead to preserve order history.")) {
      startTransition(async () => {
        const res = await deleteProduct(id)
        if (res.error) alert(res.error)
        else window.location.reload()
      })
    }
  }

  const handleArchive = (id: string) => {
    if (confirm("Are you sure you want to archive this product? It will be hidden from the store.")) {
      startTransition(async () => {
        const res = await archiveProduct(id)
        if (res.error) alert(res.error)
        else window.location.reload()
      })
    }
  }

  const stats = {
    total: products.length,
    published: products.filter(p => p.status === "Published").length,
    draft: products.filter(p => p.status === "Draft").length,
    archived: products.filter(p => p.status === "Archived").length,
    lowStock: products.filter(p => p.trackInventory && (p.stockQuantity as number) <= (p.lowStockThreshold as number)).length,
  }

  if (view === "form") {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-6">
        <div className="mb-6 flex items-center">
          <button onClick={handleCloseForm} className="mr-4 p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
        </div>
        <ProductForm
          initialData={editingProduct}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isPending={isPending}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border bg-muted/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Store className="w-6 h-6 mr-3 text-primary" /> Store Management
          </h2>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">Total Products</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">Published</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{stats.published}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">Drafts</p>
            <p className="text-2xl font-bold mt-1">{stats.draft}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">Low Stock</p>
            <p className="text-2xl font-bold mt-1 text-orange-500">{stats.lowStock}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">Archived</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{stats.archived}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {products.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Box className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-bold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Get started by creating your first product. It will be saved as a draft until you publish it.</p>
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {product.images && product.images.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-5 h-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm bg-muted px-2 py-1 rounded-md">{product.category}</span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {formatINR(product.price)}
                    </td>
                    <td className="py-3 px-4">
                      {product.trackInventory ? (
                        <span className={`text-sm font-medium ${product.stockQuantity <= product.lowStockThreshold ? 'text-orange-500' : ''}`}>
                          {product.stockQuantity} in stock
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not tracked</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        product.status === 'Published' ? 'bg-green-500/10 text-green-600' :
                        product.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {product.status}
                      </span>
                      {product.isFeatured && (
                        <span className="ml-2 text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Featured</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/store/${product.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors" title="View in store">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleOpenForm(product)} className="p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        {product.status !== "Archived" && (
                          <button onClick={() => handleArchive(product._id)} className="p-1.5 text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 rounded-md transition-colors" title="Archive">
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(product._id)} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
