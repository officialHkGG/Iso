"use server"

import { documentStorage, getCurrentUser } from "@/lib/local-storage"
import { revalidatePath } from "next/cache"

export async function createDocument(formData: FormData) {
  const user = getCurrentUser() || { id: "system" }

  const title = formData.get("title") as string
  const documentNumber = formData.get("documentNumber") as string
  const type = formData.get("type") as string
  const description = formData.get("description") as string
  const reviewDate = formData.get("reviewDate") as string
  const fileUrl = formData.get("fileUrl") as string | null

  const data = await documentStorage.create({
    title,
    document_number: documentNumber,
    type,
    description,
    version: "1.0",
    status: "draft",
    owner_id: user.id,
    review_date: reviewDate || null,
    file_url: fileUrl,
  })

  revalidatePath("/dashboard/documents")
  return { success: true, data }
}

export async function updateDocument(id: string, formData: FormData) {
  getCurrentUser()

  const title = formData.get("title") as string
  const documentNumber = formData.get("documentNumber") as string
  const type = formData.get("type") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as string
  const reviewDate = formData.get("reviewDate") as string
  const fileUrl = formData.get("fileUrl") as string | null

  const updateData: any = {
    title,
    document_number: documentNumber,
    type,
    description,
    status,
    review_date: reviewDate || null,
  }

  if (fileUrl) {
    updateData.file_url = fileUrl
  }

  const data = await documentStorage.update(id, updateData)

  if (!data) {
    return { error: "Document not found" }
  }

  revalidatePath("/dashboard/documents")
  return { success: true, data }
}

export async function deleteDocument(id: string) {
  getCurrentUser()
  const document = await documentStorage.getById(id)

  if (document?.file_url) {
    try {
      await fetch("/api/delete-file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: document.file_url }),
      })
    } catch (error) {
      console.error("Failed to delete file from Blob:", error)
    }
  }

  await documentStorage.delete(id)

  revalidatePath("/dashboard/documents")
  return { success: true }
}

export async function approveDocument(id: string) {
  const user = getCurrentUser() || { id: "system" }

  const data = await documentStorage.update(id, {
    status: "approved",
    approved_by: user.id,
    approved_date: new Date().toISOString(),
  })

  if (!data) {
    return { error: "Document not found" }
  }

  revalidatePath("/dashboard/documents")
  return { success: true, data }
}

export async function deleteAllDocuments() {
  getCurrentUser()

  // Get all documents with file URLs
  const documents = await documentStorage.getAll()

  // Delete all files from Blob storage
  if (documents) {
    for (const doc of documents) {
      if (doc.file_url) {
        try {
          await fetch("/api/delete-file", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: doc.file_url }),
          })
        } catch (error) {
          console.error("Failed to delete file from Blob:", error)
        }
      }
    }
  }

  await documentStorage.deleteAll()

  revalidatePath("/dashboard/documents")
  return { success: true, count: documents?.length || 0 }
}
