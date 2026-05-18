"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { companySettingsStorage } from "@/lib/local-storage"
import { toast } from "sonner"
import { Upload, Building2 } from "lucide-react"
import Image from "next/image"

export function CompanySettingsForm() {
  const [companyName, setCompanyName] = useState("")
  const [address, setAddress] = useState("")
  const [preparerName, setPreparerName] = useState("")
  const [reviewerName, setReviewerName] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await companySettingsStorage.get()
      if (settings) {
        setCompanyName(settings.companyName || "")
        setAddress(settings.address || "")
        setPreparerName(settings.preparerName || "")
        setReviewerName(settings.reviewerName || "")
        setLogo(settings.logo || null)
      }
    }

    void loadSettings()
  }, [])

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB")
      return
    }

    setLogoFile(file)

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setLogo(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required")
      return
    }

    await companySettingsStorage.save({
      companyName,
      address,
      preparerName,
      reviewerName,
      logo: logo || undefined,
    })

    toast.success("Company settings saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Template Settings</CardTitle>
        <CardDescription>
          Configure your company information for automatic document processing. This will be used to replace
          placeholders in uploaded document templates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <Image src={logo || "/placeholder.svg"} alt="Company logo" fill className="object-contain" />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="cursor-pointer" />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG (max 2MB)</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              placeholder="e.g., MedTech Solutions Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Company Address</Label>
            <Textarea
              id="address"
              placeholder="e.g., 123 Medical Device Blvd, Boston, MA 02101"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preparerName">Default Preparer Name</Label>
              <Input
                id="preparerName"
                placeholder="e.g., John Smith"
                value={preparerName}
                onChange={(e) => setPreparerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewerName">Default Reviewer Name</Label>
              <Input
                id="reviewerName"
                placeholder="e.g., Jane Doe"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Save Company Settings
        </Button>
      </CardContent>
    </Card>
  )
}
