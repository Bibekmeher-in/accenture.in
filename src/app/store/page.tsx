import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { Store, Search, ArrowRight, Tag } from "lucide-react"
import clientPromise from "@/lib/mongodb"
import Link from "next/link"
import { formatINR } from "@/lib/currency"

export const metadata: Metadata = {
  title: "Store",
  description: "Browse our professional products and merchandise.",
}

export default async function StorePage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const productsRaw = await db
    .collection("products")
    .find({ status: "Published" })
    .sort({ createdAt: -1 })
    .toArray()

  // Extract unique categories that actually have products
  const categories = Array.from(new Set(productsRaw.map(p => p.category)))

  const featuredProducts = productsRaw.filter(p => p.isFeatured)
  const allOtherProducts = productsRaw.filter(p => !p.isFeatured)

  if (productsRaw.length === 0) {
    return (
      <div className="flex flex-col min-h-[60vh] py-16 md:py-24">
        <Container>
          <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto">
            <div className="bg-primary/10 p-6 rounded-full">
              <Store className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">TEKNIXX Store</h1>
            <p className="text-xl text-muted-foreground">
              We are currently setting up our inventory. Please check back soon for our professional merchandise and products.
            </p>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Store Header */}
      <div className="bg-muted/30 py-16 md:py-24 border-b border-border">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 uppercase">TEKNIXX Store</h1>
            <p className="text-xl text-muted-foreground">
              Official professional merchandise, books, and digital tools.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        {/* Categories / Navigation */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12 pb-6 border-b border-border">
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-sm">
              All Products
            </span>
            {categories.map(category => (
              <span key={category} className="px-4 py-2 bg-muted text-foreground rounded-full text-sm font-medium hover:bg-muted/80 cursor-pointer transition-colors">
                {category}
              </span>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search store..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Featured Section */}
        {featuredProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Tag className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Featured Products</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map(product => (
                <ProductCard key={product._id.toString()} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* All Products Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-8">All Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allOtherProducts.map(product => (
              <ProductCard key={product._id.toString()} product={product} />
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProductCard({ product }: { product: any }) {
  const isOutOfStock = product.trackInventory && !product.allowOutOfStockPurchase && product.stockQuantity <= 0

  return (
    <Link 
      href={`/store/${product.slug}`}
      className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.images && product.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <Store className="w-16 h-16" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
              Sold Out
            </span>
          )}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <span className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{product.category}</span>
        <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-black text-lg">{formatINR(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">{formatINR(product.compareAtPrice)}</span>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </Link>
  )
}
