"use server"

import { trainingStorage, getCurrentUser } from "@/lib/local-storage"
import { revalidatePath } from "next/cache"

export async function createTraining(formData: FormData) {
  const user = getCurrentUser() || { id: "system" }

  const title = formData.get("title") as string
  const trainingNumber = formData.get("trainingNumber") as string
  const type = formData.get("type") as string
  const description = formData.get("description") as string
  const instructor = formData.get("instructor") as string
  const durationHours = formData.get("durationHours") as string
  const validityMonths = formData.get("validityMonths") as string

  const data = await trainingStorage.create({
    title,
    training_number: trainingNumber,
    type,
    description,
    instructor,
    duration_hours: durationHours ? Number.parseFloat(durationHours) : null,
    validity_months: validityMonths ? Number.parseInt(validityMonths) : null,
    status: "scheduled",
    created_by: user.id,
  })

  revalidatePath("/dashboard/training")
  return { success: true, data }
}

export async function updateTraining(id: string, formData: FormData) {
  getCurrentUser()

  const title = formData.get("title") as string
  const trainingNumber = formData.get("trainingNumber") as string
  const type = formData.get("type") as string
  const description = formData.get("description") as string
  const instructor = formData.get("instructor") as string
  const durationHours = formData.get("durationHours") as string
  const validityMonths = formData.get("validityMonths") as string
  const status = formData.get("status") as string

  const data = await trainingStorage.update(id, {
    title,
    training_number: trainingNumber,
    type,
    description,
    instructor,
    duration_hours: durationHours ? Number.parseFloat(durationHours) : null,
    validity_months: validityMonths ? Number.parseInt(validityMonths) : null,
    status,
  })

  if (!data) {
    return { error: "Training record not found" }
  }

  revalidatePath("/dashboard/training")
  return { success: true, data }
}

export async function deleteTraining(id: string) {
  getCurrentUser()

  await trainingStorage.delete(id)

  revalidatePath("/dashboard/training")
  return { success: true }
}
