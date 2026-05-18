"use client"

import type React from "react"
import { useState } from "react"
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { documentStorage, fileToBase64 } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface UploadedFile {
  file: File
  status: "pending" | "processing" | "success" | "error"
  progress: number
  details: {
    title: string
    document_number: string
    type: string
    version: string
    category: string
  }
  error?: string
  documentId?: string
}

export function BulkUploadClient({ userId }: { userId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/msword" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    addFiles(droppedFiles)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const generateDefaultDetails = (file: File) => {
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    const parts = nameWithoutExt.split(/[-_]/)

    return {
      title: nameWithoutExt,
      document_number: parts.length > 1 ? parts[0] : `DOC-${Date.now().toString().slice(-6)}`,
      type: "SOP",
      version: "1.0",
      category: "Quality",
    }
  }

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
      details: generateDefaultDetails(file),
    }))
    setFiles((prev) => [...prev, ...uploadedFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  const updateDetails = (index: number, field: string, value: string) => {
    setFiles((prev) => prev.map((f, idx) => (idx === index ? { ...f, details: { ...f.details, [field]: value } } : f)))
  }

  const uploadAllFiles = async () => {
    setIsProcessing(true)
    let uploadedCount = 0

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue

      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "processing", progress: 30 } : f)))

      try {
        const file = files[i].file
        const details = files[i].details
        const fileUrl = await fileToBase64(file)

        await documentStorage.create({
          title: details.title,
          document_number: details.document_number,
          type: details.type as any,
          version: details.version,
          category: details.category,
          status: "draft",
          effective_date: new Date().toISOString().split("T")[0],
          file_url: fileUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          owner_id: userId,
        })

        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "success", progress: 100 } : f)))
        uploadedCount += 1
      } catch (error) {
        console.error("[v0] Upload error:", error)
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : f,
          ),
        )
      }
    }

    setIsProcessing(false)

    toast({
      title: "Upload Complete",
      description: `Successfully uploaded ${uploadedCount} document(s).`,
    })
  }

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const successCount = files.filter((f) => f.status === "success").length
  const errorCount = files.filter((f) => f.status === "error").length
  const pendingCount = files.filter((f) => f.status === "pending").length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop your documents here, or click to browse. Supports PDF, Word, and Excel files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop your documents here</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, Word, and Excel files (.pdf, .doc, .docx, .xls, .xlsx)
            </p>
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileInput}
              className="hidden"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
          </div>

          {files.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {files.length} file(s) selected
                {pendingCount > 0 && ` • ${pendingCount} pending`}
                {successCount > 0 && ` • ${successCount} uploaded`}
                {errorCount > 0 && ` • ${errorCount} failed`}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setFiles([])} disabled={isProcessing}>
                  Clear All
                </Button>
                {pendingCount > 0 && (
                  <Button onClick={uploadAllFiles} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${pendingCount} Document${pendingCount > 1 ? "s" : ""}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Review</CardTitle>
            <CardDescription>Review and edit document details before uploading</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium truncate">{file.file.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              file.status === "success"
                                ? "default"
                                : file.status === "error"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {file.status}
                          </Badge>
                          {file.status === "pending" && (
                            <Button variant="ghost" size="sm" onClick={() => removeFile(idx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {file.status === "pending" && (
                        <div className="space-y-3 mt-3">
                          {editingIndex === idx ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Title</Label>
                                <Input
                                  value={file.details.title}
                                  onChange={(e) => updateDetails(idx, "title", e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Document Number</Label>
                                <Input
                                  value={file.details.document_number}
                                  onChange={(e) => updateDetails(idx, "document_number", e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={file.details.type}
                                  onValueChange={(value) => updateDetails(idx, "type", value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="SOP">SOP</SelectItem>
                                    <SelectItem value="Work Instruction">Work Instruction</SelectItem>
                                    <SelectItem value="Form">Form</SelectItem>
                                    <SelectItem value="Policy">Policy</SelectItem>
                                    <SelectItem value="Procedure">Procedure</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Category</Label>
                                <Select
                                  value={file.details.category}
                                  onValueChange={(value) => updateDetails(idx, "category", value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Quality">Quality</SelectItem>
                                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                    <SelectItem value="Design">Design</SelectItem>
                                    <SelectItem value="Testing">Testing</SelectItem>
                                    <SelectItem value="Regulatory">Regulatory</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Version</Label>
                                <Input
                                  value={file.details.version}
                                  onChange={(e) => updateDetails(idx, "version", e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingIndex(null)}
                                  className="h-8"
                                >
                                  Done
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="font-medium">Title:</span> {file.details.title}
                                </div>
                                <div>
                                  <span className="font-medium">Number:</span> {file.details.document_number}
                                </div>
                                <div>
                                  <span className="font-medium">Type:</span> {file.details.type} •{" "}
                                  <span className="font-medium">Category:</span> {file.details.category} •{" "}
                                  <span className="font-medium">Version:</span> {file.details.version}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setEditingIndex(idx)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {file.error && <p className="text-sm text-red-600 mb-2">{file.error}</p>}

                      {file.status === "processing" && <Progress value={file.progress} className="h-2 mt-2" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {successCount === files.length && files.length > 0 && (
              <div className="mt-6 text-center">
                <Button onClick={() => router.push("/dashboard/documents")}>View All Documents</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
