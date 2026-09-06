"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Trash2, UserCog, UserPlus } from "lucide-react"
import { createUser, deleteUser, updateRole } from "./actions"

interface User {
  _id: string
  username: string
  role: string
  createdAt: string
}

export function UsersTable({ users }: { users: User[] }) {
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading("create")
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    const res = await createUser(data.username, data.password, data.role)
    if (res.error) {
      setError(res.error)
    } else {
      setIsCreating(false)
    }
    setLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return
    setLoading(id)
    setError(null)
    const res = await deleteUser(id)
    if (res?.error) setError(res.error)
    setLoading(null)
  }

  async function handleRoleChange(id: string, currentRole: string) {
    const newRole = currentRole === "super_admin" ? "admin" : "super_admin"
    if (!confirm(`Change role to ${newRole}?`)) return
    setLoading(id)
    setError(null)
    const res = await updateRole(id, newRole)
    if (res?.error) setError(res.error)
    setLoading(null)
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-card">
        <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold text-foreground">No users found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mb-6">
          There are no administrators configured in the system.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-md text-sm border border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(!isCreating)} variant="default">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {isCreating && (
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="font-bold mb-4">Create Administrator</h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                name="username"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                name="role"
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading === "create"}>
                {loading === "create" ? "Creating..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Username</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Created At</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{user.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    user.role === 'super_admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(user.createdAt).toISOString().split('T')[0]}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleChange(user._id, user.role)}
                      disabled={loading === user._id}
                    >
                      Toggle Role
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                      onClick={() => handleDelete(user._id)}
                      disabled={loading === user._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
