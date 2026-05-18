import type { User } from "@supabase/supabase-js"

import { syncCurrentUserProfile } from "@/lib/local-storage"

export function getProfileFromAuthUser(user: User) {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email?.split("@")[0] || "Customer"

  return {
    id: user.id,
    email: user.email || "",
    full_name: fullName,
    role: typeof user.user_metadata?.role === "string" ? user.user_metadata.role : "customer",
    department:
      typeof user.user_metadata?.department === "string" ? user.user_metadata.department : "Customer Portal",
    iso_system: typeof user.user_metadata?.iso_system === "string" ? user.user_metadata.iso_system : "iso-13485",
  }
}

export async function syncAuthenticatedUser(user: User) {
  const profile = getProfileFromAuthUser(user)
  await syncCurrentUserProfile(profile)
  return profile
}
