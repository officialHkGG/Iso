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
import { riskStorage } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface RiskDialogProps {
  risk?: any
  users?: Array<{ id: string; full_name: string }>
  trigger?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function RiskDialog({ risk, users = [], trigger, onOpenChange, onSuccess }: RiskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const isEdit = Boolean(risk)

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
    const ownerId = formData.get("ownerId") as string
    const riskData = {
      risk_number: formData.get("riskNumber") as string,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      severity: Number(formData.get("severity") || 1),
      occurrence: Number(formData.get("occurrence") || 1),
      detection: Number(formData.get("detection") || 1),
      mitigation_plan: (formData.get("mitigationPlan") as string) || null,
      status: formData.get("status") as string,
      owner_id: ownerId === "unassigned" ? null : ownerId,
    }

    try {
      if (isEdit) {
        await riskStorage.update(risk.id, riskData)
      } else {
        await riskStorage.create(riskData)
      }

      toast({
        title: "Success",
        description: `Risk ${isEdit ? "updated" : "created"} successfully`,
      })
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save risk assessment",
        variant: "destructive",
      })
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
            New Risk Assessment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Risk Assessment" : "Create Risk Assessment"}</DialogTitle>
            <DialogDescription>Capture hazard scoring, ownership, and mitigation controls.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="riskNumber">Risk Number</Label>
                <Input id="riskNumber" name="riskNumber" defaultValue={risk?.risk_number} placeholder="RSK-001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={risk?.status || "identified"}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="assessed">Assessed</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={risk?.title} placeholder="Potential process hazard" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={risk?.description || ""} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {["severity", "occurrence", "detection"].map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="capitalize">
                    {field}
                  </Label>
                  <Select name={field} defaultValue={String(risk?.[field] || 1)}>
                    <SelectTrigger id={field}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <Select name="ownerId" defaultValue={risk?.owner_id || "unassigned"}>
                <SelectTrigger id="ownerId">
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

            <div className="space-y-2">
              <Label htmlFor="mitigationPlan">Mitigation Plan</Label>
              <Textarea id="mitigationPlan" name="mitigationPlan" defaultValue={risk?.mitigation_plan || ""} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Update" : "Create"} Risk
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
