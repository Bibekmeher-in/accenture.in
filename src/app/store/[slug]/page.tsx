import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { notFound } from "next/navigation"
import clientPromise from "@/lib/mongodb"
import { Store, Tag, ChevronRight } from "lucide-react"
import Link from "next/link"
import { formatINR } from "@/lib/currency"
import { ProductActions } from "./ProductActions"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const client = await clientPromise
  const db = client.db("accenture")
  const product = await db.collection("products").findOne({ slug: params.slug, status: "Published" })

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: product.name,
    description: product.shortDescription || product.description.substring(0, 160),
  }
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const client = await clientPromise
  const db = client.db("accenture")
  const product = await db.collection("products").findOne({ slug: params.slug, status: "Published" })

  if (!product) {
    notFound()
  }

  const isOutOfStock = product.trackInventory && !product.allowOutOfStockPurchase && product.stockQuantity <= 0

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Breadcrumbs */}
      <div className="border-b border-border bg-muted/10">
        <Container>
          <div className="flex items-center py-4 text-sm text-muted-foreground">
            <Link href="/store" className="hover:text-foreground transition-colors">Store</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-foreground font-medium">{product.category}</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="truncate">{product.name}</span>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden border border-border relative">
              {product.images && product.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <Store className="w-24 h-24" />
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.images.map((img: string, i: number) => (
                  <div key={i} className="w-24 h-24 shrink-0 rounded-xl bg-muted border border-border overflow-hidden cursor-pointer hover:ring-2 ring-primary ring-offset-2 transition-all">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`${product.name} ${i+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.isFeatured && (
                <span className="text-xs font-bold tracking-widest text-orange-500 uppercase bg-orange-500/10 px-3 py-1 rounded-full flex items-center">
                  <Tag className="w-3 h-3 mr-1" /> Featured
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-4 text-foreground">
              {product.name}
            </h1>
            
            <div className="flex items-end gap-4 mb-6">
              <span className="text-4xl font-bold">{formatINR(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xl text-muted-foreground line-through mb-1">{formatINR(product.compareAtPrice)}</span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-lg text-muted-foreground mb-8">
                {product.shortDescription}
              </p>
            )}

            <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-1">
                {isOutOfStock ? (
                  <span className="w-3 h-3 rounded-full bg-destructive" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                )}
                <span className="font-semibold">{isOutOfStock ? "Out of Stock" : "In Stock"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isOutOfStock ? "This item is currently unavailable." : "Ready to ship immediately."}
              </p>
            </div>

            <div className="mb-12">
              <ProductActions product={product} />
            </div>

            {/* Description Tab */}
            <div className="border-t border-border pt-8 mt-auto">
              <h3 className="text-xl font-bold mb-4">Product Details</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                {product.tags.map((tag: string) => (
                  <span key={tag} className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
