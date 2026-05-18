"use client"

import { useState, useEffect } from "react"
import { documentStorage } from "@/lib/local-storage"
import type { DocumentRevision } from "@/lib/local-storage"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { History, Download } from "lucide-react"

interface DocumentRevisionTrackerProps {
  documentId: string
}

export function DocumentRevisionTracker({ documentId }: DocumentRevisionTrackerProps) {
  const [revisions, setRevisions] = useState<DocumentRevision[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadRevisions()
    }
  }, [open, documentId])

  const loadRevisions = async () => {
    const revisionHistory = await documentStorage.getRevisions(documentId)
    setRevisions(revisionHistory)
  }

  const handleDownloadRevision = async (revision: DocumentRevision) => {
    let fileUrl = revision.file_url

    if (revision.file_id && !fileUrl) {
      const { getFile } = await import("@/lib/indexed-db")
      const file = await getFile(revision.file_id)
      fileUrl = file?.data
    }

    if (fileUrl) {
      const link = document.createElement("a")
      link.href = fileUrl
      link.download = `revision_${revision.version}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <History className="h-4 w-4" />
          Revision History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document Revision History</DialogTitle>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardDescription>Track all changes and versions of this document</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {revisions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No revision history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {revisions.map((revision, index) => (
                    <div
                      key={revision.id}
                      className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <Badge variant={index === 0 ? "default" : "secondary"}>v{revision.version}</Badge>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">Version {revision.version}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(revision.revised_at).toLocaleString()}
                            </p>
                          </div>
                          {(revision.file_url || revision.file_id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadRevision(revision)}
                              className="gap-2"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                          )}
                        </div>
                        <p className="text-sm">{revision.changes}</p>
                        <p className="text-xs text-muted-foreground">Revised by: {revision.revised_by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
