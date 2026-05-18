"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/")
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">Opening dashboard...</CardContent>
      </Card>
    </main>
  )
}
