import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { StoreManager } from "./StoreManager"

export const metadata: Metadata = {
  title: "Store Management | Admin",
}

export default async function AdminStorePage() {
  const client = await clientPromise
  const db = client.db("accenture")

  const productsRaw = await db
    .collection("products")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  const products = productsRaw.map(product => ({
    _id: product._id.toString(),
    title: product.title,
    description: product.description,
    price: product.price,
    isPublished: product.isPublished,
    imageRef: product.imageRef,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Store</h1>
          <p className="text-muted-foreground mt-2">Manage products and store catalog.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-[70vh]">
        <StoreManager initialProducts={products} />
      </div>
    </div>
  )
}
