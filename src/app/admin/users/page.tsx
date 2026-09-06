import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import { UsersTable } from "./UsersTable"


export const metadata: Metadata = {
  title: "User Management | Admin Portal",
}

export default async function UsersPage() {
  const { authorized } = await requireRole("super_admin")
  if (!authorized) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Unauthorized: You must be a Super Admin to view this page.
      </div>
    )
  }

  const client = await clientPromise
  const db = client.db("accenture")

  const users = await db.collection("admin").find({}).sort({ createdAt: -1 }).toArray()

  // Strip password hashes before passing to client
  const safeUsers = users.map(u => ({
    _id: u._id.toString(),
    username: u.username,
    role: u.role || "admin",
    createdAt: u.createdAt?.toISOString() || new Date().toISOString()
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage administrators and their roles.</p>
      </div>

      <UsersTable users={safeUsers} />
    </div>
  )
}
