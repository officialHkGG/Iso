"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ISO_SYSTEMS, profileStorage } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface UserDialogProps {
  user?: any
  trigger?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function UserDialog({ user, trigger, onOpenChange, onSuccess }: UserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const isEdit = Boolean(user)

  useEffect(() => {
    if (trigger && (trigger as any).type === "div") {
      setOpen(true)
    }
  }, [trigger])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const userData = {
      full_name: formData.get("fullName") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      department: (formData.get("department") as string) || null,
      iso_system: formData.get("isoSystem") as string,
    }

    try {
      if (isEdit) {
        await profileStorage.update(user.id, userData)
      } else {
        await profileStorage.create(userData)
      }

      toast({ title: "Success", description: `User ${isEdit ? "updated" : "created"} successfully` })
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({ title: "Error", description: "Failed to save user", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>Manage QMS access, role, and department assignment.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" defaultValue={user?.full_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user?.email} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={user?.role || "user"}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="quality_manager">Quality Manager</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" defaultValue={user?.department || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isoSystem">Primary ISO System</Label>
              <Select name="isoSystem" defaultValue={user?.iso_system || "iso-13485"}>
                <SelectTrigger id="isoSystem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISO_SYSTEMS.map((system) => (
                    <SelectItem key={system.value} value={system.value}>
                      {system.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Update" : "Add"} User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
