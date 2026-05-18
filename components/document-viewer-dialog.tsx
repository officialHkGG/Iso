"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, Maximize2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { getFile } from "@/lib/indexed-db"

interface DocumentViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: any
}

export function DocumentViewerDialog({ open, onOpenChange, document }: DocumentViewerDialogProps) {
  const [fileData, setFileData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadFile() {
      if (!document || !open) {
        setFileData(null)
        return
      }

      setLoading(true)
      try {
        if (document.file_id) {
          // File is in IndexedDB
          const file = await getFile(document.file_id)
          if (file) {
            setFileData(file.data)
          }
        } else if (document.file_url) {
          // File is inline
          setFileData(document.file_url)
        }
      } catch (error) {
        console.error("[v0] Error loading file:", error)
        toast.error("Failed to load file")
      } finally {
        setLoading(false)
      }
    }

    loadFile()
  }, [document, open])

  if (!document) return null

  const handleDownload = () => {
    if (!fileData) {
      toast.error("No file available for download")
      return
    }

    try {
      const link = window.document.createElement("a")
      link.href = fileData
      const fileName = document.file_name || `${document.document_number}.${getFileExtension(document)}`
      link.download = fileName

      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)

      toast.success(`Downloaded ${fileName}`)
    } catch (error) {
      console.error("[v0] Download error:", error)
      toast.error("Failed to download file")
    }
  }

  const handleOpenMaximized = () => {
    if (!fileData) {
      toast.error("No file available to view")
      return
    }

    try {
      const fileType = getFileType(document)
      const isPDF = fileType === "pdf"
      const isImage = ["png", "jpg", "jpeg", "gif", "svg"].includes(fileType)

      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.title} - ${document.document_number}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background: #f5f5f5;
                  height: 100vh;
                  display: flex;
                  flex-direction: column;
                }
                .header {
                  background: white;
                  border-bottom: 1px solid #e5e5e5;
                  padding: 16px 24px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .title {
                  font-size: 18px;
                  font-weight: 600;
                  color: #1a1a1a;
                }
                .meta {
                  font-size: 13px;
                  color: #666;
                  margin-top: 4px;
                }
                .actions {
                  display: flex;
                  gap: 8px;
                }
                button {
                  padding: 8px 16px;
                  border: 1px solid #e5e5e5;
                  border-radius: 6px;
                  background: white;
                  color: #1a1a1a;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                }
                button:hover {
                  background: #f5f5f5;
                  border-color: #d4d4d4;
                }
                button.primary {
                  background: #0070f3;
                  color: white;
                  border-color: #0070f3;
                }
                button.primary:hover {
                  background: #0051cc;
                  border-color: #0051cc;
                }
                .content {
                  flex: 1;
                  display: flex;
                  overflow: hidden;
                  background: white;
                  margin: 16px;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                iframe, img {
                  width: 100%;
                  height: 100%;
                  border: none;
                }
                .preview-placeholder {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100%;
                  color: #666;
                  gap: 16px;
                  padding: 40px;
                  text-align: center;
                }
                .icon {
                  width: 64px;
                  height: 64px;
                  background: #f5f5f5;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 32px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="title">${document.title}</div>
                  <div class="meta">
                    ${document.document_number} | Version ${document.version} | ${document.type}
                  </div>
                </div>
                <div class="actions">
                  <button onclick="window.print()">
                    <span>🖨️</span> Print
                  </button>
                  <button class="primary" onclick="downloadFile()">
                    <span>⬇️</span> Download
                  </button>
                </div>
              </div>
              <div class="content">
                ${
                  isPDF
                    ? `<iframe src="${fileData}#view=FitH" type="application/pdf"></iframe>`
                    : isImage
                      ? `<img src="${fileData}" alt="${document.title}" />`
                      : `<div class="preview-placeholder">
                          <div class="icon">📄</div>
                          <div>
                            <h2>${document.file_name || "Document"}</h2>
                            <p>This ${fileType.toUpperCase()} file cannot be previewed in the browser.</p>
                            <p>Click the Download button above to open it in your preferred application.</p>
                          </div>
                        </div>`
                }
              </div>
              <script>
                function downloadFile() {
                  const link = document.createElement('a');
                  link.href = '${fileData}';
                  link.download = '${document.file_name || document.document_number + "." + fileType}';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              </script>
            </body>
          </html>
        `)
        newWindow.document.close()
      }
    } catch (error) {
      console.error("[v0] View error:", error)
      toast.error("Failed to open file viewer")
    }
  }

  const getFileExtension = (doc: any): string => {
    if (doc.file_name) {
      const parts = doc.file_name.split(".")
      return parts[parts.length - 1] || "docx"
    }
    return "docx"
  }

  const getFileType = (doc: any): string => {
    const ext = getFileExtension(doc).toLowerCase()
    return ext
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">{document.title}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {document.document_number} • Version {document.version}
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Type</div>
              <Badge variant="outline">{document.type}</Badge>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Status</div>
              <Badge
                variant={
                  document.status === "approved" ? "default" : document.status === "draft" ? "secondary" : "outline"
                }
              >
                {document.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Last Modified</div>
              <div className="text-sm font-medium">{new Date(document.updated_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 bg-muted/20">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            ) : fileData ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-2">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Document Ready</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {document.file_name && (
                      <>
                        File: <span className="font-mono font-medium">{document.file_name}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleOpenMaximized} size="lg">
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Open Viewer
                  </Button>
                  <Button variant="outline" onClick={handleDownload} size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No file attached to this document</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
