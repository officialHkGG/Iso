import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const fileName = file.name
    const fileSize = file.size
    const fileType = file.type

    console.log("[v0] Analyzing document:", fileName, fileType, fileSize)

    // Create fallback analysis based on filename
    const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
    const lowerFileName = fileName.toLowerCase()

    const fallbackAnalysis = {
      type:
        lowerFileName.includes("wi") || lowerFileName.includes("instruction")
          ? "Work Instruction"
          : lowerFileName.includes("sop") || lowerFileName.includes("procedure")
            ? "SOP"
            : lowerFileName.includes("form") || lowerFileName.includes("template")
              ? "Form"
              : lowerFileName.includes("policy")
                ? "Policy"
                : lowerFileName.includes("manual")
                  ? "Manual"
                  : lowerFileName.includes("spec")
                    ? "Specification"
                    : lowerFileName.includes("drawing") || lowerFileName.includes("dwg")
                      ? "Drawing"
                      : "Document",
      category:
        lowerFileName.includes("mfg") || lowerFileName.includes("manufacturing")
          ? "Manufacturing"
          : lowerFileName.includes("qa") || lowerFileName.includes("quality")
            ? "Quality"
            : lowerFileName.includes("design")
              ? "Design"
              : lowerFileName.includes("test")
                ? "Testing"
                : "Quality",
      title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      version: lowerFileName.match(/v(\d+\.?\d*)/)?.[1] || lowerFileName.match(/rev\s*([a-z0-9]+)/i)?.[1] || "1.0",
      document_number: `DOC-${Date.now().toString().slice(-6)}`,
    }

    // Try AI analysis, but use fallback if it fails
    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: `Analyze this document and categorize it for an ISO 13485 Quality Management System.

Filename: ${fileName}
File Type: ${fileType}
File Size: ${fileSize} bytes

Based on the filename and file type, determine:
1. Document Type: Choose from [SOP, Work Instruction, Form, Policy, Procedure, Record, Report, Manual, Specification, Drawing]
2. Category: Choose from [Quality, Manufacturing, Design, Testing, Regulatory, Training, Maintenance, Safety, Calibration]
3. Suggested Title: A clean, professional title (remove file extensions and clean up formatting)
4. Version: Extract or suggest version (e.g., "1.0", "Rev A", "v2.1")
5. Document Number: Suggest a document number format (e.g., "WI-MFG-001", "SOP-QA-015")

Rules:
- If filename contains "WI", "work instruction", or "instruction" → Type: Work Instruction
- If filename contains "SOP", "procedure" → Type: SOP  
- If filename contains "form", "template" → Type: Form
- If filename contains "policy" → Type: Policy
- If filename contains "manual" → Type: Manual
- If filename contains "spec", "specification" → Type: Specification
- If filename contains "drawing", "dwg" → Type: Drawing
- Extract version numbers from filename (v1, v2, rev a, etc.)

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "type": "Work Instruction",
  "category": "Manufacturing",
  "title": "Assembly Work Instruction",
  "version": "1.0",
  "document_number": "WI-MFG-001"
}`,
      })

      // Parse AI response
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const aiAnalysis = JSON.parse(jsonMatch[0])
        console.log("[v0] AI analysis successful:", aiAnalysis)
        return NextResponse.json(aiAnalysis)
      } else {
        console.log("[v0] No JSON in AI response, using fallback")
        return NextResponse.json(fallbackAnalysis)
      }
    } catch (aiError) {
      console.log("[v0] AI analysis failed, using fallback:", aiError)
      return NextResponse.json(fallbackAnalysis)
    }
  } catch (error) {
    console.error("[v0] Error in analyze-document route:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
