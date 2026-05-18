"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { syncAuthenticatedUser } from "@/lib/auth"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) {
      setCheckingSession(false)
      return
    }

    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        await syncAuthenticatedUser(data.session.user)
        router.replace("/dashboard/")
        return
      }

      setCheckingSession(false)
    })
  }, [configured, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!configured) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.")
      return
    }

    setLoading(true)

    const supabase = getSupabaseBrowserClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError || !data.user) {
      setLoading(false)
      setError("Wrong email or password.")
      return
    }

    await syncAuthenticatedUser(data.user)
    router.replace("/dashboard/")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1fr_440px]">
        <section className="hidden border-r bg-sidebar lg:flex lg:flex-col lg:justify-between">
          <div className="p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold leading-none">Lisora</p>
                <p className="text-sm text-muted-foreground">QMS Platform</p>
              </div>
            </div>
          </div>
          <div className="max-w-xl p-10">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Secure customer access</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-sidebar-foreground">
              Sign in to manage your quality system.
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              Each customer account is authenticated through Supabase and only sees its own QMS records.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl">Log in</CardTitle>
                <CardDescription>Use the email and password created in Supabase.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {checkingSession ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking session...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Log in
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
