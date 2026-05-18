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
import { Plus, Loader2, Upload, FileText, X } from "lucide-react"
import { documentStorage, getCurrentUser, fileToBase64 } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

const documentTypes = ["SOP", "Work Instruction", "Form", "Policy", "Procedure", "Record"]
const statusTypes = ["draft", "in_review", "approved", "obsolete"]
const categories = ["Quality", "Manufacturing", "Design", "Testing", "Regulatory", "Training"]

interface DocumentDialogProps {
  document?: {
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
  }
  trigger?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DocumentDialog({ document, trigger, onOpenChange, onSuccess }: DocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<string | null>(document?.file_url || null)
  const { toast } = useToast()

  const isEdit = !!document

  useEffect(() => {
    if (trigger && (trigger as any).type === "div") {
      setOpen(true)
    }
  }, [trigger])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)

    try {
      const base64 = await fileToBase64(file)
      setFileData(base64)
      toast({
        title: "File selected",
        description: file.name,
      })
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Failed to process the selected file",
        variant: "destructive",
      })
    }
  }

  const handleFileRemove = () => {
    setUploadedFile(null)
    setFileData(null)
  }

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

      const docData: any = {
        title: formData.get("title") as string,
        document_number: formData.get("documentNumber") as string,
        type: formData.get("type") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        review_date: (formData.get("reviewDate") as string) || null,
        file_url: fileData,
        file_name: uploadedFile?.name || document?.file_name || null,
        file_type: uploadedFile?.type || document?.file_type || null,
        file_size: uploadedFile?.size || document?.file_size || null,
      }

      if (isEdit) {
        docData.status = formData.get("status") as string
        await documentStorage.update(document.id, docData)
      } else {
        await documentStorage.create({
          ...docData,
          version: "1.0",
          status: "draft",
          owner_id: user.id,
        })
      }

      toast({
        title: "Success",
        description: `Document ${isEdit ? "updated" : "created"} successfully`,
      })
      handleOpenChange(false)
      setUploadedFile(null)
      setFileData(null)
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
    if (!newOpen) {
      setUploadedFile(null)
      if (!document?.file_url) {
        setFileData(null)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{isEdit ? "Edit Document" : "Create New Document"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the document details below. All changes will be tracked."
                : "Add a new controlled document to the quality management system."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Document Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Quality Control Procedure"
                  defaultValue={document?.title}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">
                    Document Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="documentNumber"
                    name="documentNumber"
                    placeholder="DOC-001"
                    defaultValue={document?.document_number}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Document Type <span className="text-destructive">*</span>
                  </Label>
                  <Select name="type" defaultValue={document?.type || "SOP"} required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={document?.category || "Quality"}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the document purpose and scope"
                  defaultValue={document?.description || ""}
                  rows={3}
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wide">File Attachment</h3>

              <div className="space-y-2">
                <Label htmlFor="fileUpload">Upload Document File</Label>
                {uploadedFile || (fileData && document) ? (
                  <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {uploadedFile?.name || document?.file_name || "Attached file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedFile
                          ? `${(uploadedFile.size / 1024).toFixed(2)} KB`
                          : document?.file_size
                            ? `${(document.file_size / 1024).toFixed(2)} KB`
                            : "File attached"}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={handleFileRemove}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <Label htmlFor="fileUpload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">Click to upload</span>
                      <span className="text-sm text-muted-foreground"> or drag and drop</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel (max 10MB)</p>
                    <Input
                      id="fileUpload"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status and Review Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Status & Review</h3>

              <div className="grid grid-cols-2 gap-4">
                {isEdit && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={document?.status || "draft"}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusTypes.map((status) => (
                          <SelectItem key={status} value={status}>
                            <span className="capitalize">{status.replace("_", " ")}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reviewDate">Next Review Date</Label>
                  <Input id="reviewDate" name="reviewDate" type="date" defaultValue={document?.review_date || ""} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Update Document" : "Create Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
