"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2, ShieldCheck } from "lucide-react"

import { syncAuthenticatedUser } from "@/lib/auth"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    if (!isSupabaseConfigured()) {
      router.replace("/login/")
      return
    }

    const supabase = getSupabaseBrowserClient()

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (!session?.user) {
        setAuthorized(false)
        setChecking(false)
        router.replace("/login/")
        return
      }

      await syncAuthenticatedUser(session.user)
      if (!mounted) return

      setAuthorized(true)
      setChecking(false)
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === "SIGNED_OUT" || !session?.user) {
        setAuthorized(false)
        router.replace("/login/")
        return
      }

      void syncAuthenticatedUser(session.user).then(() => {
        if (mounted) setAuthorized(true)
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  if (checking || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex items-center gap-3 rounded-lg border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span>Checking login...</span>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
