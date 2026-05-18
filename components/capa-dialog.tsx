"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { capaStorage, getCurrentUser } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface CAPADialogProps {
  capa?: {
    id: string
    title: string
    capa_number: string
    type: string
    priority: string
    description: string | null
    root_cause: string | null
    corrective_action: string | null
    status: string
    assigned_to: string | null
    due_date: string | null
  }
  users?: Array<{ id: string; full_name: string }>
  trigger?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function CAPADialog({ capa, users = [], trigger, onOpenChange, onSuccess }: CAPADialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isEdit = !!capa

  useEffect(() => {
    if (trigger && (trigger as any).type === "div") {
      setOpen(true)
    }
  }, [trigger])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const user = getCurrentUser()
      if (!user) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const assignedTo = formData.get("assignedTo") as string
      const capaData: any = {
        title: formData.get("title") as string,
        capa_number: formData.get("capaNumber") as string,
        type: formData.get("type") as string,
        priority: formData.get("priority") as string,
        description: formData.get("description") as string,
        root_cause: (formData.get("rootCause") as string) || null,
        due_date: (formData.get("dueDate") as string) || null,
        assigned_to: assignedTo === "unassigned" ? null : assignedTo,
      }

      if (isEdit) {
        capaData.corrective_action = (formData.get("correctiveAction") as string) || null
        capaData.status = formData.get("status") as string
        await capaStorage.update(capa.id, capaData)
      } else {
        await capaStorage.create({
          ...capaData,
          status: "open",
          created_by: user.id,
        })
      }

      toast({
        title: "Success",
        description: `CAPA ${isEdit ? "updated" : "created"} successfully`,
      })
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New CAPA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{isEdit ? "Edit CAPA" : "Create New CAPA"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update the CAPA details below." : "Create a new Corrective or Preventive Action."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capaNumber">
                    CAPA Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="capaNumber"
                    name="capaNumber"
                    placeholder="CAPA-001"
                    defaultValue={capa?.capa_number}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select name="type" defaultValue={capa?.type || "corrective"} required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief description of the issue"
                  defaultValue={capa?.title}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed description of the issue or opportunity"
                  defaultValue={capa?.description || ""}
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Analysis & Action</h3>

              <div className="space-y-2">
                <Label htmlFor="rootCause">Root Cause Analysis</Label>
                <Textarea
                  id="rootCause"
                  name="rootCause"
                  placeholder="Identified root cause(s)"
                  defaultValue={capa?.root_cause || ""}
                  rows={2}
                />
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="correctiveAction">Corrective/Preventive Action</Label>
                  <Textarea
                    id="correctiveAction"
                    name="correctiveAction"
                    placeholder="Actions taken or planned"
                    defaultValue={capa?.corrective_action || ""}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Priority & Assignment</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority <span className="text-destructive">*</span>
                  </Label>
                  <Select name="priority" defaultValue={capa?.priority || "medium"} required>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isEdit && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={capa?.status || "open"}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select name="assignedTo" defaultValue={capa?.assigned_to || "unassigned"}>
                    <SelectTrigger id="assignedTo">
                      <SelectValue placeholder="Select assignee" />
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" defaultValue={capa?.due_date || ""} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Update" : "Create"} CAPA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
