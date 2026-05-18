"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { companySettingsStorage, documentStorage, fileToBase64 } from "@/lib/local-storage"
import { toast } from "sonner"
import { Wand2, Upload, AlertCircle, CheckCircle2, Settings } from "lucide-react"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

interface TemplateProcessorPanelProps {
  onSuccess?: () => void
}

export function TemplateProcessorPanel({ onSuccess }: TemplateProcessorPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [documentNumber, setDocumentNumber] = useState("")
  const [documentTitle, setDocumentTitle] = useState("")
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0])
  const [hasSettings, setHasSettings] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await companySettingsStorage.get()
      setHasSettings(!!(settings && settings.companyName))
    }

    void loadSettings()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    console.log("File selected:", selectedFile.name, selectedFile.type, selectedFile.size)

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
    toast.success("Template uploaded successfully")
  }

  const processDocument = async () => {
    if (!file) {
      toast.error("Please select a document template")
      return
    }

    const settings = await companySettingsStorage.get()
    if (!settings || !settings.companyName) {
      toast.error("Please configure company settings first")
      return
    }

    setProcessing(true)
    setProgress(10)

    try {
      console.log("Starting document processing...")
      console.log("File:", file.name, file.size, file.type)
      console.log("Company settings:", settings)

      // Read the file
      setProgress(20)
      const arrayBuffer = await file.arrayBuffer()
      console.log("File read, buffer size:", arrayBuffer.byteLength)

      setProgress(30)
      const zip = new PizZip(arrayBuffer)
      console.log("ZIP loaded")

      // Create docxtemplater instance
      setProgress(40)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: "{{",
          end: "}}",
        },
      })
      console.log("Docxtemplater instance created")

      // Set the template variables
      setProgress(50)
      const templateData = {
        company: settings.companyName,
        companyName: settings.companyName,
        Company: settings.companyName,
        COMPANY: settings.companyName.toUpperCase(),
        address: settings.address || "",
        Address: settings.address || "",
        preparer: settings.preparerName || "",
        preparerName: settings.preparerName || "",
        Preparer: settings.preparerName || "",
        reviewer: settings.reviewerName || "",
        reviewerName: settings.reviewerName || "",
        Reviewer: settings.reviewerName || "",
        date: new Date(customDate).toLocaleDateString(),
        Date: new Date(customDate).toLocaleDateString(),
        currentDate: new Date().toLocaleDateString(),
        documentNumber: documentNumber || "TBD",
        documentTitle: documentTitle || file.name.replace(".docx", ""),
        DocumentNumber: documentNumber || "TBD",
        DocumentTitle: documentTitle || file.name.replace(".docx", ""),
      }

      console.log("Template data:", templateData)
      doc.setData(templateData)

      // Render the document
      setProgress(60)
      doc.render()
      console.log("Document rendered successfully")

      // Generate the processed document
      setProgress(70)
      const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      console.log("Generated blob size:", output.size)

      // Convert to base64 for storage
      setProgress(80)
      const base64 = await fileToBase64(new File([output], file.name))
      console.log("Converted to base64, length:", base64.length)

      if (base64.length > 5000000) {
        console.log("Large file detected, will use IndexedDB storage")
      }

      // Save to document storage
      setProgress(90)
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

      setProgress(100)
      console.log("Document saved:", newDoc.id)
      toast.success("Document processed and saved successfully!")

      // Reset form
      setFile(null)
      setDocumentNumber("")
      setDocumentTitle("")
      setProgress(0)
      onSuccess?.()
    } catch (error: any) {
      console.error("Document processing error:", error)
      console.error("Error details:", error.message)
      console.error("Error stack:", error.stack)

      let errorMessage = "Unknown error occurred"
      if (error.message) {
        errorMessage = error.message
      }
      if (error.properties && error.properties.errors) {
        console.error("Template errors:", error.properties.errors)
        errorMessage = "Template has errors. Check that all placeholders use {{ }} syntax."
      }

      toast.error(`Failed to process document: ${errorMessage}`)
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  return (
    <Card className="h-fit sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI Template Processor
        </CardTitle>
        <CardDescription>
          Upload Word templates with placeholders like {"{{company}}"} to auto-fill with your company information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSettings && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Settings Required</AlertTitle>
            <AlertDescription>
              Please configure your company settings first.
              <Link href="/dashboard/settings">
                <Button variant="link" className="p-0 h-auto">
                  <Settings className="h-3 w-3 mr-1" />
                  Go to Settings
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="template-file">Upload Template (.docx)</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <input
              id="template-file"
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              disabled={processing || !hasSettings}
              className="hidden"
            />
            <label
              htmlFor="template-file"
              className={`cursor-pointer flex flex-col items-center gap-2 ${!hasSettings ? "opacity-50" : ""}`}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">{file ? file.name : "Click to upload or drag and drop"}</span>
              <span className="text-xs text-muted-foreground">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : "Max 10MB"}
              </span>
            </label>
          </div>
        </div>

        {file && (
          <>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Template Loaded</AlertTitle>
              <AlertDescription>Ready to process with your company settings</AlertDescription>
            </Alert>

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

            {processing && (
              <div className="space-y-2">
                <Label>Processing...</Label>
                <Progress value={progress} />
              </div>
            )}

            <Button onClick={processDocument} disabled={processing || !file} className="w-full" size="lg">
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Process Template
                </>
              )}
            </Button>
          </>
        )}

        <div className="bg-muted p-3 rounded-lg space-y-2">
          <h4 className="text-xs font-semibold">Supported Placeholders:</h4>
          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
            <code className="bg-background px-1.5 py-0.5 rounded">{"{{company}}"}</code>
            <code className="bg-background px-1.5 py-0.5 rounded">{"{{address}}"}</code>
            <code className="bg-background px-1.5 py-0.5 rounded">{"{{preparer}}"}</code>
            <code className="bg-background px-1.5 py-0.5 rounded">{"{{reviewer}}"}</code>
            <code className="bg-background px-1.5 py-0.5 rounded">{"{{date}}"}</code>
            <code className="bg-background px-1.5 py-0.5 rounded">{"{{documentNumber}}"}</code>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
