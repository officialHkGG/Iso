"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Loader2, RefreshCw, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
}

interface GoogleDrivePickerProps {
  onFilesSelected: (files: File[]) => void
}

export function GoogleDrivePicker({ onFilesSelected }: GoogleDrivePickerProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<GoogleDriveFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)

  const loadFiles = async () => {
    if (!session?.accessToken) {
      toast({
        title: "Authentication required",
        description: "Please sign in with Google to access your Drive files",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Loading files from Google Drive...")

      const response = await fetch("/api/google-drive/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.accessToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Error response:", data)
        throw new Error(data.error || "Failed to load files")
      }

      console.log("[v0] Files loaded:", data.files?.length || 0)
      setFiles(data.files)

      if (data.files?.length > 0) {
        toast({
          title: "Files loaded",
          description: `Found ${data.files.length} document(s) in your Google Drive`,
        })
      }
    } catch (error: any) {
      console.error("[v0] Error loading files:", error)
      toast({
        title: "Error loading files",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && session?.accessToken) {
      loadFiles()
    }
  }

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const importSelectedFiles = async () => {
    if (selectedFiles.size === 0) return

    setImporting(true)
    try {
      const downloadedFiles: File[] = []

      for (const fileId of selectedFiles) {
        const file = files.find((f) => f.id === fileId)
        if (!file) continue

        const response = await fetch("/api/google-drive/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: session?.accessToken,
            fileId,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to download file")
        }

        const byteCharacters = atob(data.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: data.mimeType })
        const fileObj = new File([blob], data.name, { type: data.mimeType })

        downloadedFiles.push(fileObj)
      }

      onFilesSelected(downloadedFiles)
      setOpen(false)
      setSelectedFiles(new Set())

      toast({
        title: "Files imported",
        description: `Successfully imported ${downloadedFiles.length} file(s) from Google Drive`,
      })
    } catch (error: any) {
      toast({
        title: "Error importing files",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    setFiles([])
    setSelectedFiles(new Set())
    toast({
      title: "Signed out",
      description: "You've been signed out of Google Drive",
    })
  }

  if (!session) {
    return (
      <Button onClick={() => signIn("google")} variant="outline">
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Connect Your Google Drive
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Import from Your Google Drive
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from Your Google Drive</DialogTitle>
          <DialogDescription>
            <div className="flex items-center justify-between">
              <span>Select documents from your personal Google Drive to import</span>
              {session?.user?.email && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-foreground font-medium">{session.user.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-6 px-2">
                    <LogOut className="h-3 w-3 mr-1" />
                    Switch Account
                  </Button>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No PDF, Word, Excel, or Google Sheets documents found in your Google Drive
            </p>
            <Button onClick={loadFiles} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">{files.length} document(s) found</p>
              <Button onClick={loadFiles} variant="ghost" size="sm" disabled={loading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent">
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                    />
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">{selectedFiles.size} file(s) selected</p>
              <Button onClick={importSelectedFiles} disabled={selectedFiles.size === 0 || importing}>
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Selected Files
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
