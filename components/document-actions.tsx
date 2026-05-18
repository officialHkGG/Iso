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
import { Eye, Edit, Download, MoreVertical, Trash2, CheckCircle } from "lucide-react"
import { DocumentDialog } from "./document-dialog"
import { documentStorage, getCurrentUser } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface DocumentActionsProps {
  document: {
    id: string
    title: string
    document_number: string
    type: string
    description: string | null
    status: string
    category: string | null
    review_date: string | null
    file_url: string | null
    file_name?: string | null
    file_type?: string | null
    file_size?: number | null
    version: string
  }
  onUpdate?: () => void
}

export function DocumentActions({ document, onUpdate }: DocumentActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleDelete() {
    setLoading(true)
    try {
      await documentStorage.delete(document.id)
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
      setShowDeleteDialog(false)
      onUpdate?.()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    setLoading(true)
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

      await documentStorage.update(document.id, {
        status: "approved",
        approved_by: user.id,
        approved_date: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Document approved successfully",
      })
      onUpdate?.()
    } catch (error) {
      console.error("Approve error:", error)
      toast({
        title: "Error",
        description: "Failed to approve document",
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
          {document.file_url && (
            <>
              <DropdownMenuItem asChild>
                <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={document.file_url} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setOpenEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          {document.status !== "approved" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleApprove} disabled={loading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </DropdownMenuItem>
            </>
          )}
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

      <DocumentDialog
        document={document}
        trigger={openEditDialog ? <div /> : undefined}
        onOpenChange={(open) => {
          if (!open) setOpenEditDialog(false)
        }}
        onSuccess={onUpdate}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document &quot;{document.title}&quot;. This action cannot be undone.
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
