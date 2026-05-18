"use client"

import { useState } from "react"
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
import { FileUpload } from "@/components/file-upload"
import { documentStorage, getCurrentUser, fileToBase64 } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const documentTypes = ["SOP", "Work Instruction", "Form", "Policy", "Procedure", "Record"]
const categories = ["Quality", "Manufacturing", "Design", "Testing", "Regulatory", "Training"]

interface BulkUploadDialogProps {
  onSuccess?: () => void
}

export function BulkUploadDialog({ onSuccess }: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [documentType, setDocumentType] = useState("SOP")
  const [category, setCategory] = useState("Quality")
  const { toast } = useToast()

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return

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

      const documents = await Promise.all(
        selectedFiles.map(async (file, index) => {
          const base64 = await fileToBase64(file)
          const fileName = file.name.replace(/\.[^/.]+$/, "") // Remove extension

          return {
            title: fileName,
            document_number: `DOC-${Date.now()}-${index + 1}`,
            type: documentType,
            description: `Bulk uploaded document: ${fileName}`,
            category: category,
            version: "1.0",
            status: "draft",
            owner_id: user.id,
            file_url: base64,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            review_date: null,
          }
        }),
      )

      await documentStorage.bulkCreate(documents)

      toast({
        title: "Success",
        description: `Successfully uploaded ${documents.length} document(s)`,
      })

      setOpen(false)
      setSelectedFiles([])
      onSuccess?.()
    } catch (error) {
      console.error("Bulk upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Document Upload</DialogTitle>
          <DialogDescription>Upload multiple documents at once with the same category and type</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulkType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="bulkType">
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

            <div className="space-y-2">
              <Label htmlFor="bulkCategory">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="bulkCategory">
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
          </div>

          <FileUpload onFilesSelected={handleFilesSelected} multiple={true} />

          {selectedFiles.length > 0 && (
            <p className="text-sm text-muted-foreground">{selectedFiles.length} file(s) ready to upload</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkUpload} disabled={selectedFiles.length === 0 || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Upload {selectedFiles.length > 0 && `${selectedFiles.length} Documents`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
