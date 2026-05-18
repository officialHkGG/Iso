"use client"

import { useState } from "react"
import { Edit, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { riskStorage } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import { RiskDialog } from "./risk-dialog"

interface RiskActionsProps {
  risk: any
  users?: Array<{ id: string; full_name: string }>
  onUpdate?: () => void
}

export function RiskActions({ risk, users = [], onUpdate }: RiskActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    try {
      await riskStorage.delete(risk.id)
      toast({ title: "Success", description: "Risk assessment deleted successfully" })
      setShowDeleteDialog(false)
      onUpdate?.()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete risk assessment", variant: "destructive" })
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
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RiskDialog
        risk={risk}
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
            <AlertDialogTitle>Delete risk assessment?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete &quot;{risk.title}&quot;.</AlertDialogDescription>
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
