"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, FileText } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { documentStorage } from "@/lib/local-storage"
import { DocumentDialog } from "@/components/document-dialog"
import { DocumentActions } from "@/components/document-actions"
import { Button } from "@/components/ui/button"
import { ClearAllDocumentsButton } from "@/components/clear-all-documents-button"
import { BulkUploadDialog } from "@/components/bulk-upload-dialog"
import { DocumentViewerDialog } from "@/components/document-viewer-dialog"
import { DocumentRevisionTracker } from "@/components/document-revision-tracker"
import { AuditTrail } from "@/components/audit-trail"
import { useState, useEffect } from "react"

const documentTypes = ["All Types", "SOP", "Work Instruction", "Form", "Policy", "Procedure", "Record"]
const statusTypes = ["All Status", "approved", "draft", "in_review", "obsolete"]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [filteredDocs, setFilteredDocs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.document_number?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "All Types") {
      filtered = filtered.filter((d) => d.type === typeFilter)
    }

    if (statusFilter !== "All Status") {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    setFilteredDocs(filtered)
  }, [searchTerm, typeFilter, statusFilter, documents])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const docs = await documentStorage.getAll()
      setDocuments(docs)
      setFilteredDocs(docs)
    } catch (error) {
      console.error("Error loading documents:", error)
      const docs = documentStorage.getAllSync()
      setDocuments(docs)
      setFilteredDocs(docs)
    } finally {
      setLoading(false)
    }
  }

  const handleViewFile = (doc: any) => {
    setSelectedDocument(doc)
    setViewerOpen(true)
  }

  const handleDownloadFile = (doc: any) => {
    if (!doc.file_url) return

    const link = document.createElement("a")
    link.href = doc.file_url
    link.download = doc.file_name || `${doc.document_number}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Document Management</h1>
          <p className="text-muted-foreground mt-1">Control and manage quality system documents</p>
        </div>
        <div className="flex items-center gap-2">
          <ClearAllDocumentsButton onDelete={loadDocuments} />
          <BulkUploadDialog onSuccess={loadDocuments} />
          <DocumentDialog onSuccess={loadDocuments} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {documents?.filter((d) => d.status === "approved").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {documents?.filter((d) => {
                if (!d.review_date) return false
                return new Date(d.review_date) < new Date()
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due for Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {documents?.filter((d) => {
                if (!d.review_date) return false
                return new Date(d.review_date) < new Date()
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>Browse and manage controlled documents</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search documents..."
                className="pl-10 bg-muted/50 border-0 focus:bg-background transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusTypes.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="text-muted-foreground mt-4">Loading documents...</p>
            </div>
          ) : filteredDocs && filteredDocs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doc #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Revisions</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="transition-smooth hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{doc.document_number}</TableCell>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">v{doc.version}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          doc.status === "approved" ? "default" : doc.status === "draft" ? "secondary" : "outline"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.file_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFile(doc)}
                          className="transition-smooth hover:bg-accent"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DocumentRevisionTracker documentId={doc.id} />
                    </TableCell>
                    <TableCell>
                      <DocumentActions document={doc} onUpdate={loadDocuments} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== "All Types" || statusFilter !== "All Status"
                  ? "No documents match your filters."
                  : "No documents found. Create your first document to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AuditTrail entityType="document" limit={20} />

      <DocumentViewerDialog open={viewerOpen} onOpenChange={setViewerOpen} document={selectedDocument} />
    </div>
  )
}
