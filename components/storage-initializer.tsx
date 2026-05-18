"use client"

import { useEffect } from "react"
import { initializeStorage } from "@/lib/local-storage"

export function StorageInitializer() {
  useEffect(() => {
    initializeStorage()
  }, [])

  return null
}
