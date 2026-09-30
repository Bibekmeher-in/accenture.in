"use client"

import * as React from "react"
import { createProduct, updateProduct, deleteProduct, archiveProduct, toggleProductStatus, toggleProductFeatured } from "./actions"
import { Store, Plus, Edit, Trash2, Box, ArrowLeft, Eye, Archive, Search, Check, AlertCircle } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [banner, setBanner] = React.useState<{ type: "success" | "info" | "error"; message: string } | null>(null)

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
        setBanner({ type: "error", message: res.error })
      } else {
        handleCloseForm()
        setBanner({ type: "success", message: editingProduct ? "Product updated successfully." : "Product created successfully." })
        window.location.reload()
      }
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}"? If it has order history, it will be safely archived instead.`)) {
      startTransition(async () => {
        const res = await deleteProduct(id)
        if (res.error) {
          setBanner({ type: "error", message: res.error })
        } else if (res.archived) {
          alert(res.message || "Product has order history and has been safely archived.")
          window.location.reload()
        } else {
          setBanner({ type: "success", message: `Product "${name}" deleted.` })
          window.location.reload()
        }
      })
    }
  }

  const handleArchive = (id: string, name: string) => {
    if (confirm(`Are you sure you want to archive "${name}"? It will be hidden from public catalog.`)) {
      startTransition(async () => {
        const res = await archiveProduct(id)
        if (res.error) {
          setBanner({ type: "error", message: res.error })
        } else {
          setBanner({ type: "success", message: `Product "${name}" archived.` })
          window.location.reload()
        }
      })
    }
  }

  const categories = React.useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean))
    return Array.from(cats)
  }, [products])

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchQuery === "" ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus = statusFilter === "all" || p.status === statusFilter
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter

      return matchSearch && matchStatus && matchCategory
    })
  }, [products, searchQuery, statusFilter, categoryFilter])

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
    <div className="flex flex-col h-full space-y-6">
      <div className="p-6 border-b border-border bg-muted/10 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center text-foreground">
            <Store className="w-6 h-6 mr-3 text-primary" /> Store Management
          </h2>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase">Total Products</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase">Published</p>
            <p className="text-2xl font-bold mt-1 text-emerald-500">{stats.published}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase">Drafts</p>
            <p className="text-2xl font-bold mt-1 text-amber-500">{stats.draft}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase">Low Stock</p>
            <p className="text-2xl font-bold mt-1 text-rose-500">{stats.lowStock}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase">Archived</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{stats.archived}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products by name, SKU, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter products by status"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter products by category"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {banner && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-sm ${
              banner.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : banner.type === "info"
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {banner.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{banner.message}</span>
            </div>
            <button onClick={() => setBanner(null)} className="text-xs hover:underline opacity-80">
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Box className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-bold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {products.length === 0
                ? "Get started by creating your first product."
                : "No products matched your search or filters."}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => handleOpenForm()}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 overflow-x-auto border border-border rounded-xl bg-card">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground font-medium">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-muted/60 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                          {product.images && product.images.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-5 h-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold leading-tight text-foreground">{product.name}</p>
                          <p className="font-mono text-xs text-muted-foreground mt-0.5">{product.sku || "No SKU"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-muted/60 border border-border/60 px-2.5 py-1 rounded-md font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {formatINR(product.price)}
                    </td>
                    <td className="py-3 px-4">
                      {product.trackInventory ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          product.stockQuantity <= product.lowStockThreshold
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        }`}>
                          {product.stockQuantity} in stock
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not tracked</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={product.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as "Draft" | "Published" | "Archived"
                            startTransition(async () => {
                              const res = await toggleProductStatus(product._id, newStatus)
                              if (res.error) setBanner({ type: "error", message: res.error })
                              else window.location.reload()
                            })
                          }}
                          disabled={isPending}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:ring-1 focus:ring-primary/50 outline-none ${
                            product.status === "Published"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : product.status === "Draft"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <option value="Published">Published</option>
                          <option value="Draft">Draft</option>
                          <option value="Archived">Archived</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            startTransition(async () => {
                              const res = await toggleProductFeatured(product._id, !product.isFeatured)
                              if (res.error) setBanner({ type: "error", message: res.error })
                              else window.location.reload()
                            })
                          }}
                          disabled={isPending}
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border transition-colors ${
                            product.isFeatured
                              ? "text-primary bg-primary/10 border-primary/30"
                              : "text-muted-foreground/50 border-border hover:text-foreground"
                          }`}
                          title="Click to toggle featured on home/store"
                        >
                          {product.isFeatured ? "★ Featured" : "☆ Feature"}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/store/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="View in store"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleOpenForm(product)}
                          className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {product.status !== "Archived" && (
                          <button
                            onClick={() => handleArchive(product._id, product.name)}
                            className="p-1.5 rounded-lg border border-border/80 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
                            title="Archive product"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="p-1.5 rounded-lg border border-border/80 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                          title="Delete / Safe Archive"
                        >
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
