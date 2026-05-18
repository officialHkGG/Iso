import { type NextRequest, NextResponse } from "next/server"
import { documentStorage, getCurrentUser } from "@/lib/local-storage"

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser() || { id: "system" }

    const body = await request.json()
    const { title, document_number, type, version, category, file_url, status } = body

    const data = await documentStorage.create({
      title,
      document_number,
      type,
      version,
      category,
      file_url,
      status,
      created_by: user.id,
      owner_id: user.id,
    })

    return NextResponse.json({ documentId: data.id })
  } catch (error) {
    console.error("Error in bulk create:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
