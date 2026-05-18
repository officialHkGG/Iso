const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const RECORDS_TABLE = "qms_records"

type QmsRecord<T> = {
  id: string
  collection: string
  payload: T
  created_at?: string
  updated_at?: string
}

function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  return {
    url: SUPABASE_URL.replace(/\/$/, ""),
    key: SUPABASE_ANON_KEY,
  }
}

export function isSupabaseEnabled() {
  return Boolean(getSupabaseConfig())
}

function encodeFilter(value: string) {
  return encodeURIComponent(value)
}

async function requestSupabase<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig()
  if (!config) {
    throw new Error("Supabase is not configured")
  }

  const headers = new Headers(init.headers)
  headers.set("apikey", config.key)
  headers.set("Authorization", `Bearer ${config.key}`)
  headers.set("Content-Type", "application/json")

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase request failed (${response.status}): ${detail}`)
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

export async function readCollection<T>(collection: string): Promise<T[]> {
  const rows = await requestSupabase<Array<QmsRecord<T>>>(
    `${RECORDS_TABLE}?collection=eq.${encodeFilter(collection)}&select=id,payload,created_at,updated_at&order=updated_at.desc`,
  )

  return rows.map((row) => ({
    ...(row.payload as Record<string, unknown>),
    id: (row.payload as { id?: string }).id || row.id,
  })) as T[]
}

export async function upsertRecord<T extends { id: string }>(collection: string, payload: T): Promise<T> {
  const now = new Date().toISOString()
  const rows = await requestSupabase<Array<QmsRecord<T>>>(
    `${RECORDS_TABLE}?on_conflict=collection,id`,
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: payload.id,
        collection,
        payload,
        updated_at: now,
      }),
    },
  )

  return ((rows?.[0]?.payload as T) || payload) as T
}

export async function deleteRecord(collection: string, id: string): Promise<void> {
  await requestSupabase(
    `${RECORDS_TABLE}?collection=eq.${encodeFilter(collection)}&id=eq.${encodeFilter(id)}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal",
      },
    },
  )
}

export async function deleteCollection(collection: string): Promise<void> {
  await requestSupabase(`${RECORDS_TABLE}?collection=eq.${encodeFilter(collection)}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  })
}
