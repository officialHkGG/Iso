"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  trigger?: React.ReactNode
  multiple?: boolean
  accept?: string
}

export function FileUpload({ onFilesSelected, trigger, multiple = true, accept }: FileUploadProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = files.filter((f) => f.size > maxSize)

    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Some files exceed 10MB limit: ${oversizedFiles.map((f) => f.name).join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setSelectedFiles((prev) => (multiple ? [...prev, ...files] : files))

    toast({
      title: "Files selected",
      description: `${files.length} file(s) ready to upload`,
    })
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (selectedFiles.length === 0) return

    onFilesSelected(selectedFiles)
    setSelectedFiles([])
    setOpen(false)

    toast({
      title: "Upload initiated",
      description: `Processing ${selectedFiles.length} file(s)`,
    })
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>Select files from your computer to upload to the system</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={handleBrowseClick}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-2">Click to browse or drag and drop files</p>
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel, and other document formats (max 10MB per file)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={accept || ".pdf,.doc,.docx,.xls,.xlsx,.txt"}
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{selectedFiles.length} file(s) selected</p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])}>
                    Clear All
                  </Button>
                </div>

                <ScrollArea className="h-[300px] border rounded-lg p-2">
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            <Badge variant="outline" className="text-xs">
                              {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={selectedFiles.length === 0}>
                Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
