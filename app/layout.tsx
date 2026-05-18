import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { StorageInitializer } from "@/components/storage-initializer"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"

export const metadata: Metadata = {
  title: "Lisora - Quality Management System",
  description:
    "Comprehensive QMS platform supporting multiple ISO standards including ISO 9001, ISO 13485, ISO 14001, and more",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <StorageInitializer />
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  )
}
