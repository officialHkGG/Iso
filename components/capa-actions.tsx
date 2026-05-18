"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, MoreVertical, Trash2 } from "lucide-react"
import { CAPADialog } from "./capa-dialog"
import { capaStorage } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface CAPAActionsProps {
  capa: {
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
  onUpdate?: () => void
}

export function CAPAActions({ capa, users = [], onUpdate }: CAPAActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleDelete() {
    setLoading(true)
    try {
      await capaStorage.delete(capa.id)
      toast({
        title: "Success",
        description: "CAPA deleted successfully",
      })
      setShowDeleteDialog(false)
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete CAPA",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CAPADialog
        capa={capa}
        users={users}
        trigger={showEditDialog ? <div /> : undefined}
        onOpenChange={(open) => {
          if (!open) setShowEditDialog(false)
        }}
        onSuccess={onUpdate}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete CAPA &quot;{capa.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
