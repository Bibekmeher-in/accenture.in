import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { Store, ShoppingCart, Info } from "lucide-react"
import clientPromise from "@/lib/mongodb"

export const metadata: Metadata = {
  title: "Store",
  description: "Browse our professional tools and digital products.",
}

export default async function StorePage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const productsRaw = await db
    .collection("products")
    .find({ isPublished: true })
    .sort({ createdAt: -1 })
    .toArray()

  if (productsRaw.length === 0) {
    return (
      <div className="flex flex-col min-h-[60vh] py-16 md:py-24">
        <Container>
          <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto">
            <div className="bg-primary/10 p-4 rounded-full relative">
              <Store className="w-12 h-12 text-primary" />
              <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                0
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Store coming soon</h1>
            <p className="text-xl text-muted-foreground">
              We are working on setting up our store. Please check back later.
            </p>

            <div className="mt-8 p-6 bg-muted rounded-lg border border-border">
              <div className="flex items-center gap-3 text-muted-foreground justify-center mb-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Checkout is not configured.</span>
              </div>
              <p className="text-sm">Payment processing is currently unavailable.</p>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="py-16 md:py-24 bg-background min-h-[60vh]">
      <Container>
        <div className="mb-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Store Catalog</h1>
          <p className="text-xl text-muted-foreground">
            Browse our professional tools, software licenses, and digital products.
          </p>
        </div>

        <div className="mb-8 p-4 bg-muted/50 rounded-lg border border-border flex items-start gap-4 max-w-3xl">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Checkout is not configured</h4>
            <p className="text-sm text-muted-foreground mt-1">Payment processing is currently unavailable. This is a read-only catalog for demonstration purposes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {productsRaw.map(product => (
            <div key={product._id.toString()} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="bg-muted aspect-video flex items-center justify-center relative overflow-hidden">
                {product.imageRef ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageRef} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-12 h-12 text-muted-foreground/30" />
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3 gap-4">
                  <h3 className="text-xl font-bold leading-tight">{product.title}</h3>
                  <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
                </div>
                <p className="text-muted-foreground text-sm flex-1 mb-6">
                  {product.description}
                </p>
                <button disabled className="w-full py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium cursor-not-allowed">
                  Add to Cart (Disabled)
                </button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
