import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  try {
    const { accessToken, fileId } = await request.json()

    if (!accessToken || !fileId) {
      return NextResponse.json({ error: "Missing access token or file ID" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: "v3", auth: oauth2Client })

    // Get file metadata
    const fileMetadata = await drive.files.get({
      fileId,
      fields: "name, mimeType",
    })

    // Download file content
    const response = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      { responseType: "arraybuffer" },
    )

    return NextResponse.json({
      name: fileMetadata.data.name,
      mimeType: fileMetadata.data.mimeType,
      data: Buffer.from(response.data as ArrayBuffer).toString("base64"),
    })
  } catch (error: any) {
    console.error("[v0] Error downloading file from Google Drive:", error)
    return NextResponse.json({ error: error.message || "Failed to download file" }, { status: 500 })
  }
}
