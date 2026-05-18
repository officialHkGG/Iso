"use server"

import { capaStorage, getCurrentUser } from "@/lib/local-storage"
import { revalidatePath } from "next/cache"

export async function createCAPA(formData: FormData) {
  const user = getCurrentUser() || { id: "system" }

  const title = formData.get("title") as string
  const capaNumber = formData.get("capaNumber") as string
  const type = formData.get("type") as string
  const priority = formData.get("priority") as string
  const description = formData.get("description") as string
  const rootCause = formData.get("rootCause") as string
  const assignedTo = formData.get("assignedTo") as string
  const dueDate = formData.get("dueDate") as string

  const data = await capaStorage.create({
    title,
    capa_number: capaNumber,
    type,
    priority,
    description,
    root_cause: rootCause,
    status: "open",
    created_by: user.id,
    assigned_to: assignedTo || null,
    due_date: dueDate || null,
  })

  revalidatePath("/dashboard/capa")
  return { success: true, data }
}

export async function updateCAPA(id: string, formData: FormData) {
  getCurrentUser()

  const title = formData.get("title") as string
  const capaNumber = formData.get("capaNumber") as string
  const type = formData.get("type") as string
  const priority = formData.get("priority") as string
  const description = formData.get("description") as string
  const rootCause = formData.get("rootCause") as string
  const correctiveAction = formData.get("correctiveAction") as string
  const status = formData.get("status") as string
  const assignedTo = formData.get("assignedTo") as string
  const dueDate = formData.get("dueDate") as string

  const updateData: any = {
    title,
    capa_number: capaNumber,
    type,
    priority,
    description,
    root_cause: rootCause,
    corrective_action: correctiveAction,
    status,
    assigned_to: assignedTo || null,
    due_date: dueDate || null,
  }

  if (status === "closed") {
    updateData.completion_date = new Date().toISOString()
  }

  const data = await capaStorage.update(id, updateData)

  if (!data) {
    return { error: "CAPA not found" }
  }

  revalidatePath("/dashboard/capa")
  return { success: true, data }
}

export async function deleteCAPA(id: string) {
  getCurrentUser()

  await capaStorage.delete(id)

  revalidatePath("/dashboard/capa")
  return { success: true }
}
