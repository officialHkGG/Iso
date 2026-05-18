import { BulkUploadClient } from "@/components/bulk-upload-client"

export default function BulkUploadPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Document Upload</h1>
        <p className="text-muted-foreground">
          Upload multiple documents at once from your computer. Automatically organize and categorize your quality
          documents.
        </p>
      </div>

      <BulkUploadClient userId="admin" />
    </div>
  )
}
