"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/Button"
import { Trash2, UserCog, UserPlus, KeyRound, Search, ShieldCheck } from "lucide-react"
import { createUser, deleteUser, updateRole, resetUserPassword } from "./actions"

interface User {
  _id: string
  username: string
  role: string
  createdAt: string
}

export function UsersTable({ users }: { users: User[] }) {
  const [isCreating, setIsCreating] = useState(false)
  const [resettingUser, setResettingUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, roleFilter])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading("create")
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Record<string, string>

    const res = await createUser(data.username, data.password, data.role)
    if (res.error) {
      setError(res.error)
    } else {
      setIsCreating(false)
      setSuccess("Administrator created successfully.")
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(null)
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Are you sure you want to delete administrator "${username}"?`)) return
    setLoading(id)
    setError(null)
    setSuccess(null)
    const res = await deleteUser(id)
    if (res?.error) setError(res.error)
    else {
      setSuccess(`Administrator "${username}" deleted.`)
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(null)
  }

  async function handleRoleChange(id: string, currentRole: string, username: string) {
    const newRole = currentRole === "super_admin" ? "admin" : "super_admin"
    if (!confirm(`Change role of "${username}" to ${newRole}?`)) return
    setLoading(id)
    setError(null)
    setSuccess(null)
    const res = await updateRole(id, newRole)
    if (res?.error) setError(res.error)
    else {
      setSuccess(`Role updated to ${newRole} for "${username}".`)
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(null)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resettingUser) return
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading("reset")
    setError(null)
    setSuccess(null)

    const res = await resetUserPassword(resettingUser._id, newPassword)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(`Password for "${resettingUser.username}" has been securely updated.`)
      setResettingUser(null)
      setNewPassword("")
      setTimeout(() => setSuccess(null), 4000)
    }
    setLoading(null)
  }

  if (users.length === 0 && !isCreating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-card">
        <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold text-foreground">No users found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mb-6">
          There are no administrators configured in the system.
        </p>
        <Button onClick={() => setIsCreating(true)} variant="default">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Administrator
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm border border-red-500/20">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-600 p-4 rounded-xl text-sm border border-green-500/20">
          {success}
        </div>
      )}

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-xl text-sm"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button onClick={() => setIsCreating(!isCreating)} variant="default">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Administrator
        </Button>
      </div>

      {/* Create Modal Form */}
      {isCreating && (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold mb-4 text-base">Create Administrator</h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold mb-1">Username</label>
              <input
                name="username"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Temporary Password (min. 8 characters)</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Role</label>
              <select
                name="role"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading === "create"}>
                {loading === "create" ? "Creating..." : "Save Administrator"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Password Reset Modal */}
      {resettingUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold">Reset Password for {resettingUser.username}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a new secure password. The password hash will be regenerated immediately using bcrypt.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">New Password (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setResettingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading === "reset"}>
                  {loading === "reset" ? "Resetting..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs">
            <tr>
              <th className="px-6 py-3.5 font-semibold">Administrator</th>
              <th className="px-6 py-3.5 font-semibold">Role</th>
              <th className="px-6 py-3.5 font-semibold">Created At</th>
              <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No administrators match your search query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'super_admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResettingUser(user)
                          setNewPassword("")
                        }}
                        title="Reset Password"
                      >
                        <KeyRound className="h-3.5 w-3.5 mr-1 text-primary" />
                        Reset Key
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleChange(user._id, user.role, user.username)}
                        disabled={loading === user._id}
                      >
                        Toggle Role
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                        onClick={() => handleDelete(user._id, user.username)}
                        disabled={loading === user._id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3.5 bg-muted/20 border border-border rounded-xl flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
        <span>Role management and deletion protections ensure at least one active Super Admin is permanently preserved.</span>
      </div>
    </div>
  )
}
