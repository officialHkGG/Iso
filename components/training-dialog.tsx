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
import { trainingStorage } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface TrainingDialogProps {
  training?: {
    id: string
    title: string
    training_number: string
    type: string
    description: string | null
    instructor: string | null
    duration_hours: number | null
    validity_months: number | null
    status: string
  }
  trigger?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function TrainingDialog({ training, trigger, onOpenChange, onSuccess }: TrainingDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isEdit = !!training

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
      const durationHours = formData.get("durationHours") as string
      const validityMonths = formData.get("validityMonths") as string

      const trainingData: any = {
        title: formData.get("title") as string,
        training_number: formData.get("trainingNumber") as string,
        type: formData.get("type") as string,
        description: (formData.get("description") as string) || null,
        instructor: (formData.get("instructor") as string) || null,
        duration_hours: durationHours ? Number.parseFloat(durationHours) : null,
        validity_months: validityMonths ? Number.parseInt(validityMonths) : null,
      }

      if (isEdit) {
        trainingData.status = formData.get("status") as string
        await trainingStorage.update(training.id, trainingData)
      } else {
        await trainingStorage.create({
          ...trainingData,
          status: "scheduled",
        })
      }

      toast({
        title: "Success",
        description: `Training ${isEdit ? "updated" : "created"} successfully`,
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
            New Training Course
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isEdit ? "Edit Training Course" : "Create New Training Course"}
            </DialogTitle>
            <DialogDescription>
              {isEdit ? "Update the training course details below." : "Add a new training course to the system."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Course Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trainingNumber">
                    Training Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="trainingNumber"
                    name="trainingNumber"
                    placeholder="TRN-001"
                    defaultValue={training?.training_number}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select name="type" defaultValue={training?.type || "onboarding"} required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
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
                  placeholder="Training course title"
                  defaultValue={training?.title}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Course objectives and content"
                  defaultValue={training?.description || ""}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Course Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    name="instructor"
                    placeholder="Instructor name"
                    defaultValue={training?.instructor || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationHours">Duration (hours)</Label>
                  <Input
                    id="durationHours"
                    name="durationHours"
                    type="number"
                    step="0.5"
                    placeholder="4"
                    defaultValue={training?.duration_hours || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validityMonths">Validity (months)</Label>
                  <Input
                    id="validityMonths"
                    name="validityMonths"
                    type="number"
                    placeholder="12"
                    defaultValue={training?.validity_months || ""}
                  />
                </div>
                {isEdit && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={training?.status || "scheduled"}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Update" : "Create"} Training
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
