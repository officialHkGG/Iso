import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let browserClient: SupabaseClient | null = null

export function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  return {
    url: SUPABASE_URL.replace(/\/$/, ""),
    key: SUPABASE_ANON_KEY,
  }
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig())
}

export function getSupabaseBrowserClient() {
  const config = getSupabaseConfig()
  if (!config) {
    throw new Error("Supabase is not configured")
  }

  if (!browserClient) {
    browserClient = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return browserClient
}
