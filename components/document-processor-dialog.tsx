"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { companySettingsStorage, documentStorage, fileToBase64 } from "@/lib/local-storage"
import { toast } from "sonner"
import { FileCode, Wand2 } from "lucide-react"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"

interface DocumentProcessorDialogProps {
  onSuccess?: () => void
}

export function DocumentProcessorDialog({ onSuccess }: DocumentProcessorDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [documentNumber, setDocumentNumber] = useState("")
  const [documentTitle, setDocumentTitle] = useState("")
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".docx")) {
      toast.error("Please upload a .docx file")
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB")
      return
    }

    setFile(selectedFile)
    setDocumentTitle(selectedFile.name.replace(".docx", ""))
  }

  const processDocument = async () => {
    if (!file) {
      toast.error("Please select a document template")
      return
    }

    const settings = await companySettingsStorage.get()
    if (!settings || !settings.companyName) {
      toast.error("Please configure company settings first in the Settings page")
      return
    }

    setProcessing(true)

    try {
      console.log("[v0] Starting document processing...")
      console.log("[v0] Company settings:", settings)

      // Read the file
      const arrayBuffer = await file.arrayBuffer()
      const zip = new PizZip(arrayBuffer)

      // Create docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      })

      // Set the template variables
      const templateData = {
        company: settings.companyName,
        companyName: settings.companyName,
        address: settings.address || "",
        preparer: settings.preparerName || "",
        preparerName: settings.preparerName || "",
        reviewer: settings.reviewerName || "",
        reviewerName: settings.reviewerName || "",
        date: new Date(customDate).toLocaleDateString(),
        currentDate: new Date().toLocaleDateString(),
        documentNumber: documentNumber || "TBD",
        documentTitle: documentTitle || file.name.replace(".docx", ""),
      }

      console.log("[v0] Template data:", templateData)
      doc.setData(templateData)

      // Render the document
      doc.render()
      console.log("[v0] Document rendered successfully")

      // Generate the processed document
      const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      console.log("[v0] Generated blob size:", output.size)

      // Convert to base64 for storage
      const base64 = await fileToBase64(new File([output], file.name))
      console.log("[v0] Converted to base64, length:", base64.length)

      // Save to document storage
      const newDoc = await documentStorage.create({
        document_number: documentNumber || `DOC-${Date.now()}`,
        title: documentTitle || file.name.replace(".docx", ""),
        type: "SOP",
        version: "1.0",
        status: "draft",
        file_url: base64,
        file_name: file.name,
        owner_id: "admin",
        review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })

      console.log("[v0] Document saved:", newDoc.id)
      toast.success("Document processed and saved successfully!")
      setOpen(false)
      setFile(null)
      setDocumentNumber("")
      setDocumentTitle("")
      onSuccess?.()
    } catch (error: any) {
      console.error("[v0] Document processing error:", error)
      console.error("[v0] Error details:", error.message, error.stack)
      toast.error(`Failed to process document: ${error.message || "Unknown error"}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="h-4 w-4 mr-2" />
          Process Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Document Template Processor</DialogTitle>
          <DialogDescription>
            Upload a Word document template and automatically replace company information, headers, and footers with
            your configured settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template-file">Document Template (.docx)</Label>
            <Input id="template-file" type="file" accept=".docx" onChange={handleFileChange} disabled={processing} />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm">Template Variables</h4>
            <p className="text-xs text-muted-foreground">
              Your document template can use these placeholders. They will be automatically replaced:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <code className="bg-background px-2 py-1 rounded">{"{{company}}"}</code>
              </div>
              <div>
                <code className="bg-background px-2 py-1 rounded">{"{{companyName}}"}</code>
              </div>
              <div>
                <code className="bg-background px-2 py-1 rounded">{"{{address}}"}</code>
              </div>
              <div>
                <code className="bg-background px-2 py-1 rounded">{"{{preparer}}"}</code>
              </div>
              <div>
                <code className="bg-background px-2 py-1 rounded">{"{{reviewer}}"}</code>
              </div>
              <div>
                <code className="bg-background px-2 py-1 rounded">{"{{date}}"}</code>
              </div>
              <div>
                <code className="bg-background px-2 py-1 rounded">{"{{documentNumber}}"}</code>
              </div>
              <div>
                <code className="bg-background px-2 py-1 rounded">{"{{documentTitle}}"}</code>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-number">Document Number</Label>
            <Input
              id="doc-number"
              placeholder="e.g., SOP-001"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              disabled={processing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-title">Document Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g., Quality Control Procedure"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              disabled={processing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-date">Document Date</Label>
            <Input
              id="doc-date"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              disabled={processing}
            />
          </div>

          <Button onClick={processDocument} disabled={processing || !file} className="w-full">
            {processing ? (
              <>Processing...</>
            ) : (
              <>
                <FileCode className="h-4 w-4 mr-2" />
                Process Document
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
