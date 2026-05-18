import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "No access token provided" }, { status: 401 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: "v3", auth: oauth2Client })

    const response = await drive.files.list({
      pageSize: 1000,
      fields: "files(id, name, mimeType, size, modifiedTime, webViewLink, parents)",
      q: "trashed=false and (mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/msword' or mimeType='application/vnd.ms-word' or mimeType='application/vnd.ms-excel' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.google-apps.spreadsheet' or name contains '.pdf' or name contains '.doc' or name contains '.docx' or name contains '.xls' or name contains '.xlsx')",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    console.log("[v0] Google Drive files found:", response.data.files?.length || 0)
    console.log(
      "[v0] Sample files:",
      response.data.files?.slice(0, 3).map((f) => ({ name: f.name, mimeType: f.mimeType })),
    )

    return NextResponse.json({ files: response.data.files || [] })
  } catch (error: any) {
    console.error("[v0] Error listing Google Drive files:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to list files",
        details: error.response?.data || error.toString(),
      },
      { status: 500 },
    )
  }
}
