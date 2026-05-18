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
import { Textarea } from "@/components/ui/textarea"
import { auditStorage } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface AuditDialogProps {
  audit?: any
  users?: Array<{ id: string; full_name: string }>
  trigger?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function AuditDialog({ audit, users = [], trigger, onOpenChange, onSuccess }: AuditDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const isEdit = Boolean(audit)

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
    const auditorId = formData.get("auditorId") as string
    const status = formData.get("status") as string
    const auditData: any = {
      audit_number: formData.get("auditNumber") as string,
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      scope: (formData.get("scope") as string) || null,
      audit_date: (formData.get("auditDate") as string) || null,
      status,
      auditor_id: auditorId === "unassigned" ? null : auditorId,
    }

    if (status === "completed" || status === "closed") {
      auditData.completion_date = new Date().toISOString()
    }

    try {
      if (isEdit) {
        await auditStorage.update(audit.id, auditData)
      } else {
        await auditStorage.create(auditData)
      }

      toast({ title: "Success", description: `Audit ${isEdit ? "updated" : "scheduled"} successfully` })
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({ title: "Error", description: "Failed to save audit", variant: "destructive" })
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
            Schedule Audit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Audit" : "Schedule Audit"}</DialogTitle>
            <DialogDescription>Plan and track internal, supplier, and external audits.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="auditNumber">Audit Number</Label>
                <Input id="auditNumber" name="auditNumber" defaultValue={audit?.audit_number} placeholder="AUD-001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={audit?.type || "internal"}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={audit?.title} placeholder="Annual QMS internal audit" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Textarea id="scope" name="scope" defaultValue={audit?.scope || ""} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="auditDate">Audit Date</Label>
                <Input id="auditDate" name="auditDate" type="date" defaultValue={audit?.audit_date || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={audit?.status || "planned"}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditorId">Auditor</Label>
                <Select name="auditorId" defaultValue={audit?.auditor_id || "unassigned"}>
                  <SelectTrigger id="auditorId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Update" : "Schedule"} Audit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
