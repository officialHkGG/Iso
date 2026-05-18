import { getSupabaseBrowserClient, getSupabaseConfig, isSupabaseConfigured } from "./supabase-client"

const RECORDS_TABLE = "qms_records"

type QmsRecord<T> = {
  id: string
  user_id: string
  collection: string
  payload: T
  created_at?: string
  updated_at?: string
}

type SupabaseAuthContext = {
  accessToken: string
  userId: string
}

export function isSupabaseEnabled() {
  return isSupabaseConfigured()
}

function encodeFilter(value: string) {
  return encodeURIComponent(value)
}

async function getSupabaseAuthContext(): Promise<SupabaseAuthContext> {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error(`Supabase auth failed: ${error.message}`)
  }

  if (!session?.access_token || !session.user?.id) {
    throw new Error("You must be logged in to access QMS data.")
  }

  return {
    accessToken: session.access_token,
    userId: session.user.id,
  }
}

function getRecordId(userId: string, id: string) {
  return `${userId}:${id}`
}

async function requestSupabase<T>(
  path: string,
  init: RequestInit = {},
  authContext?: SupabaseAuthContext,
): Promise<T> {
  const config = getSupabaseConfig()
  if (!config) {
    throw new Error("Supabase is not configured")
  }

  const auth = authContext || (await getSupabaseAuthContext())
  const headers = new Headers(init.headers)
  headers.set("apikey", config.key)
  headers.set("Authorization", `Bearer ${auth.accessToken}`)
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
    `${RECORDS_TABLE}?collection=eq.${encodeFilter(collection)}&select=id,user_id,payload,created_at,updated_at&order=updated_at.desc`,
  )

  return rows.map((row) => ({
    ...(row.payload as Record<string, unknown>),
    id: (row.payload as { id?: string }).id || row.id,
  })) as T[]
}

export async function upsertRecord<T extends { id: string }>(collection: string, payload: T): Promise<T> {
  const auth = await getSupabaseAuthContext()
  const now = new Date().toISOString()
  const rows = await requestSupabase<Array<QmsRecord<T>>>(
    `${RECORDS_TABLE}?on_conflict=collection,id`,
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: getRecordId(auth.userId, payload.id),
        user_id: auth.userId,
        collection,
        payload,
        updated_at: now,
      }),
    },
    auth,
  )

  return ((rows?.[0]?.payload as T) || payload) as T
}

export async function deleteRecord(collection: string, id: string): Promise<void> {
  const auth = await getSupabaseAuthContext()
  await requestSupabase(
    `${RECORDS_TABLE}?collection=eq.${encodeFilter(collection)}&id=eq.${encodeFilter(getRecordId(auth.userId, id))}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal",
      },
    },
    auth,
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
