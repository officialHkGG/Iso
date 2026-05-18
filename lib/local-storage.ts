import { deleteFile, getFile, storeFile } from "./indexed-db"
import { deleteCollection, deleteRecord, isSupabaseEnabled, readCollection, upsertRecord } from "./supabase-records"

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const STORAGE_KEYS = {
  DOCUMENTS: "qms_documents",
  DOCUMENT_REVISIONS: "qms_document_revisions",
  CHANGE_LOGS: "qms_change_logs",
  CAPA: "qms_capa",
  AUDITS: "qms_audits",
  FINDINGS: "qms_findings",
  RISKS: "qms_risks",
  TRAINING: "qms_training",
  TRAINING_COMPLETIONS: "qms_training_completions",
  PROFILES: "qms_profiles",
  CURRENT_USER: "qms_current_user",
  COMPANY_SETTINGS: "qms_company_settings",
  ISO_SYSTEM: "qms_iso_system",
  NOTIFICATIONS: "qms_notifications",
  COMPLIANCE_CHECKLIST: "qms_compliance_checklist",
}

const COLLECTIONS = {
  DOCUMENTS: "documents",
  DOCUMENT_REVISIONS: "document_revisions",
  CHANGE_LOGS: "change_logs",
  CAPA: "capas",
  AUDITS: "audits",
  FINDINGS: "findings",
  RISKS: "risks",
  TRAINING: "training",
  TRAINING_COMPLETIONS: "training_completions",
  PROFILES: "profiles",
  COMPANY_SETTINGS: "company_settings",
  NOTIFICATIONS: "notifications",
  COMPLIANCE_CHECKLIST: "compliance_items",
  PREFERENCES: "preferences",
}

function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function setToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

async function getRows<T>(key: string, collection: string): Promise<T[]> {
  if (isSupabaseEnabled()) {
    return readCollection<T>(collection)
  }

  return getFromStorage<T>(key)
}

async function createRow<T extends { id: string }>(key: string, collection: string, row: T): Promise<T> {
  if (isSupabaseEnabled()) {
    return upsertRecord(collection, row)
  }

  const rows = getFromStorage<T>(key)
  rows.push(row)
  setToStorage(key, rows)
  return row
}

async function updateRow<T extends { id: string }>(
  key: string,
  collection: string,
  id: string,
  patch: Partial<T>,
): Promise<T | null> {
  if (isSupabaseEnabled()) {
    const existingRows = await readCollection<T>(collection)
    const existing = existingRows.find((row) => row.id === id)
    if (!existing) return null
    return upsertRecord(collection, { ...existing, ...patch, id } as T)
  }

  const rows = getFromStorage<T>(key)
  const index = rows.findIndex((row) => row.id === id)
  if (index === -1) return null

  rows[index] = { ...rows[index], ...patch, id }
  setToStorage(key, rows)
  return rows[index]
}

async function deleteRow(key: string, collection: string, id: string): Promise<boolean> {
  if (isSupabaseEnabled()) {
    await deleteRecord(collection, id)
    return true
  }

  const rows = getFromStorage<{ id: string }>(key)
  setToStorage(
    key,
    rows.filter((row) => row.id !== id),
  )
  return true
}

async function deleteRows(key: string, collection: string): Promise<boolean> {
  if (isSupabaseEnabled()) {
    await deleteCollection(collection)
    return true
  }

  setToStorage(key, [])
  return true
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  return user ? JSON.parse(user) : null
}

export function setCurrentUser(user: any) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
}

export const ISO_SYSTEMS = [
  { value: "iso-9001", label: "ISO 9001:2015", description: "Quality Management Systems" },
  { value: "iso-13485", label: "ISO 13485:2016", description: "Medical Devices QMS" },
  { value: "iso-14001", label: "ISO 14001:2015", description: "Environmental Management" },
  { value: "iso-27001", label: "ISO 27001:2022", description: "Information Security" },
  { value: "iso-45001", label: "ISO 45001:2018", description: "Occupational Health & Safety" },
  { value: "iso-22000", label: "ISO 22000:2018", description: "Food Safety Management" },
] as const

export function getISOSystem() {
  if (typeof window === "undefined") return ISO_SYSTEMS[0]
  const stored = localStorage.getItem(STORAGE_KEYS.ISO_SYSTEM)
  if (stored) {
    const system = ISO_SYSTEMS.find((s) => s.value === stored)
    return system || ISO_SYSTEMS[0]
  }
  return ISO_SYSTEMS[0]
}

export function setISOSystem(systemValue: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.ISO_SYSTEM, systemValue)

  if (isSupabaseEnabled()) {
    void upsertRecord(COLLECTIONS.PREFERENCES, {
      id: "iso_system",
      value: systemValue,
      updated_at: new Date().toISOString(),
    })
  }
}

export function initializeStorage() {
  if (typeof window === "undefined") return

  const currentUser = getCurrentUser()
  if (!currentUser) {
    const defaultUser = {
      id: generateId(),
      email: "admin@example.com",
      full_name: "Admin User",
      role: "admin",
      department: "Quality Assurance",
      iso_system: "iso-13485",
    }

    setCurrentUser(defaultUser)
    setISOSystem("iso-13485")

    const profiles = getFromStorage<any>(STORAGE_KEYS.PROFILES)
    if (profiles.length === 0) {
      setToStorage(STORAGE_KEYS.PROFILES, [defaultUser])
    }

    if (isSupabaseEnabled()) {
      void upsertRecord(COLLECTIONS.PROFILES, defaultUser)
    }
  }
}

export const documentStorage = {
  getAll: async () => {
    const docs = await getRows<any>(STORAGE_KEYS.DOCUMENTS, COLLECTIONS.DOCUMENTS)
    const profiles = await profileStorage.getAll()

    const docsWithFiles = await Promise.all(
      docs.map(async (doc) => {
        if (!isSupabaseEnabled() && doc.file_id) {
          try {
            const file = await getFile(doc.file_id)
            return {
              ...doc,
              file_url: file?.data || null,
              file_name: file?.name || doc.file_name,
              file_type: file?.type || doc.file_type,
              file_size: file?.size || doc.file_size,
            }
          } catch (error) {
            console.error("[qms] Error loading file from IndexedDB:", error)
          }
        }
        return doc
      }),
    )

    return docsWithFiles.map((doc) => ({
      ...doc,
      owner: profiles.find((profile) => profile.id === doc.owner_id),
      approver: profiles.find((profile) => profile.id === doc.approved_by),
    }))
  },

  getAllSync: () => {
    const docs = getFromStorage<any>(STORAGE_KEYS.DOCUMENTS)
    const profiles = getFromStorage<any>(STORAGE_KEYS.PROFILES)

    return docs.map((doc) => ({
      ...doc,
      owner: profiles.find((profile) => profile.id === doc.owner_id),
      approver: profiles.find((profile) => profile.id === doc.approved_by),
    }))
  },

  getById: async (id: string) => {
    const docs = await getRows<any>(STORAGE_KEYS.DOCUMENTS, COLLECTIONS.DOCUMENTS)
    const doc = docs.find((item) => item.id === id)

    if (!isSupabaseEnabled() && doc?.file_id) {
      try {
        const file = await getFile(doc.file_id)
        return { ...doc, file_url: file?.data || null }
      } catch (error) {
        console.error("[qms] Error loading file:", error)
      }
    }

    return doc
  },

  getRevisions: async (documentId: string) => {
    const revisions = await getRows<DocumentRevision>(STORAGE_KEYS.DOCUMENT_REVISIONS, COLLECTIONS.DOCUMENT_REVISIONS)
    return revisions
      .filter((revision) => revision.document_id === documentId)
      .sort((a, b) => new Date(b.revised_at).getTime() - new Date(a.revised_at).getTime())
  },

  createRevision: async (documentId: string, data: Omit<DocumentRevision, "id" | "document_id" | "revised_at">) => {
    const currentUser = getCurrentUser()
    let fileId = null

    if (!isSupabaseEnabled() && data.file_url && data.file_url.length > 50000) {
      fileId = `revision_${generateId()}`
      await storeFile(fileId, data.file_url, {
        name: `revision_${data.version}`,
        type: "application/octet-stream",
        size: data.file_url.length,
      })
    }

    const newRevision: DocumentRevision = {
      ...data,
      id: generateId(),
      document_id: documentId,
      revised_by: currentUser?.id || "system",
      revised_at: new Date().toISOString(),
      file_id: fileId || undefined,
      file_url: fileId ? undefined : data.file_url,
    }

    return createRow(STORAGE_KEYS.DOCUMENT_REVISIONS, COLLECTIONS.DOCUMENT_REVISIONS, newRevision)
  },

  create: async (data: any) => {
    const newId = generateId()
    const currentUser = getCurrentUser()
    let fileId = null

    if (!isSupabaseEnabled() && data.file_url && data.file_url.length > 50000) {
      fileId = `file_${newId}`
      await storeFile(fileId, data.file_url, {
        name: data.file_name || "document",
        type: data.file_type || "application/octet-stream",
        size: data.file_size || data.file_url.length,
      })
    }

    const newDoc = {
      ...data,
      id: newId,
      file_id: fileId,
      file_url: fileId ? null : data.file_url,
      version: data.version || "1.0",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const created = await createRow(STORAGE_KEYS.DOCUMENTS, COLLECTIONS.DOCUMENTS, newDoc)
    await changeLogStorage.create({
      entity_type: "document",
      entity_id: newId,
      action: "created",
      changes: { ...newDoc },
      performed_by: currentUser?.id || "system",
    })

    return created
  },

  update: async (id: string, data: any) => {
    const existingDoc = await documentStorage.getById(id)
    if (!existingDoc) return null

    const currentUser = getCurrentUser()
    let fileId = existingDoc.file_id || null

    if (!isSupabaseEnabled() && data.file_url && data.file_url !== existingDoc.file_url) {
      if (existingDoc.file_id) {
        await deleteFile(existingDoc.file_id)
      }

      if (data.file_url.length > 50000) {
        fileId = `file_${id}`
        await storeFile(fileId, data.file_url, {
          name: data.file_name || "document",
          type: data.file_type || "application/octet-stream",
          size: data.file_size || data.file_url.length,
        })
      } else {
        fileId = null
      }
    }

    const changes: Record<string, any> = {}
    Object.keys(data).forEach((key) => {
      if (existingDoc[key] !== data[key]) {
        changes[key] = { from: existingDoc[key], to: data[key] }
      }
    })

    const updated = await updateRow<any>(STORAGE_KEYS.DOCUMENTS, COLLECTIONS.DOCUMENTS, id, {
      ...data,
      file_id: fileId,
      file_url: fileId ? null : data.file_url,
      updated_at: new Date().toISOString(),
    })

    if (updated && Object.keys(changes).length > 0) {
      await changeLogStorage.create({
        entity_type: "document",
        entity_id: id,
        action: "updated",
        changes,
        performed_by: currentUser?.id || "system",
      })
    }

    return updated
  },

  approve: async (id: string, approverId: string, comments?: string) => {
    const result = await documentStorage.update(id, {
      status: "approved",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      approval_comments: comments,
    })

    if (result) {
      await changeLogStorage.create({
        entity_type: "document",
        entity_id: id,
        action: "approved",
        changes: { status: "approved", comments },
        performed_by: approverId,
      })
    }

    return result
  },

  delete: async (id: string) => {
    const doc = await documentStorage.getById(id)
    const currentUser = getCurrentUser()

    if (!isSupabaseEnabled() && doc?.file_id) {
      await deleteFile(doc.file_id)
    }

    await deleteRow(STORAGE_KEYS.DOCUMENTS, COLLECTIONS.DOCUMENTS, id)
    await changeLogStorage.create({
      entity_type: "document",
      entity_id: id,
      action: "deleted",
      changes: { ...doc },
      performed_by: currentUser?.id || "system",
    })

    return true
  },

  deleteAll: async () => {
    const docs = await getRows<any>(STORAGE_KEYS.DOCUMENTS, COLLECTIONS.DOCUMENTS)
    if (!isSupabaseEnabled()) {
      await Promise.all(docs.filter((doc) => doc.file_id).map((doc) => deleteFile(doc.file_id)))
    }

    return deleteRows(STORAGE_KEYS.DOCUMENTS, COLLECTIONS.DOCUMENTS)
  },

  bulkCreate: async (documents: any[]) => {
    return Promise.all(documents.map((document) => documentStorage.create(document)))
  },
}

export const capaStorage = {
  getAll: async () => {
    const capas = await getRows<any>(STORAGE_KEYS.CAPA, COLLECTIONS.CAPA)
    const profiles = await profileStorage.getAll()

    return capas.map((capa) => ({
      ...capa,
      assigned: profiles.find((profile) => profile.id === capa.assigned_to),
      creator: profiles.find((profile) => profile.id === capa.created_by),
    }))
  },

  create: async (data: any) => {
    const newCapa = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.CAPA, COLLECTIONS.CAPA, newCapa)
  },

  update: async (id: string, data: any) =>
    updateRow<any>(STORAGE_KEYS.CAPA, COLLECTIONS.CAPA, id, {
      ...data,
      updated_at: new Date().toISOString(),
    }),

  delete: async (id: string) => deleteRow(STORAGE_KEYS.CAPA, COLLECTIONS.CAPA, id),
}

export const auditStorage = {
  getAll: async () => {
    const audits = await getRows<any>(STORAGE_KEYS.AUDITS, COLLECTIONS.AUDITS)
    const profiles = await profileStorage.getAll()

    return audits.map((audit) => ({
      ...audit,
      auditor: profiles.find((profile) => profile.id === audit.auditor_id),
    }))
  },

  create: async (data: any) => {
    const audit = {
      ...data,
      id: generateId(),
      findings_count: data.findings_count || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.AUDITS, COLLECTIONS.AUDITS, audit)
  },

  update: async (id: string, data: any) =>
    updateRow<any>(STORAGE_KEYS.AUDITS, COLLECTIONS.AUDITS, id, {
      ...data,
      updated_at: new Date().toISOString(),
    }),

  delete: async (id: string) => deleteRow(STORAGE_KEYS.AUDITS, COLLECTIONS.AUDITS, id),
}

export const findingStorage = {
  getAll: async () => {
    const findings = await getRows<any>(STORAGE_KEYS.FINDINGS, COLLECTIONS.FINDINGS)
    const audits = await auditStorage.getAll()

    return findings.map((finding) => ({
      ...finding,
      audit: audits.find((audit) => audit.id === finding.audit_id),
    }))
  },

  getByAudit: async (auditId: string) => {
    const findings = await findingStorage.getAll()
    return findings.filter((finding) => finding.audit_id === auditId)
  },

  create: async (data: any) => {
    const finding = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.FINDINGS, COLLECTIONS.FINDINGS, finding)
  },
}

export const riskStorage = {
  getAll: async () => {
    const risks = await getRows<any>(STORAGE_KEYS.RISKS, COLLECTIONS.RISKS)
    const profiles = await profileStorage.getAll()

    return risks.map((risk) => ({
      ...risk,
      owner: profiles.find((profile) => profile.id === risk.owner_id),
    }))
  },

  create: async (data: any) => {
    const severity = Number(data.severity || 1)
    const occurrence = Number(data.occurrence || 1)
    const detection = Number(data.detection || 1)
    const rpn = severity * occurrence * detection
    const newRisk = {
      ...data,
      id: generateId(),
      severity,
      occurrence,
      detection,
      rpn,
      risk_level: data.risk_level || getRiskLevelValue(rpn),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.RISKS, COLLECTIONS.RISKS, newRisk)
  },

  update: async (id: string, data: any) => {
    const severity = Number(data.severity || 1)
    const occurrence = Number(data.occurrence || 1)
    const detection = Number(data.detection || 1)
    const rpn = severity * occurrence * detection
    return updateRow<any>(STORAGE_KEYS.RISKS, COLLECTIONS.RISKS, id, {
      ...data,
      severity,
      occurrence,
      detection,
      rpn,
      risk_level: getRiskLevelValue(rpn),
      updated_at: new Date().toISOString(),
    })
  },

  delete: async (id: string) => deleteRow(STORAGE_KEYS.RISKS, COLLECTIONS.RISKS, id),
}

function getRiskLevelValue(rpn: number) {
  if (rpn >= 100) return "critical"
  if (rpn >= 50) return "high"
  if (rpn >= 20) return "medium"
  return "low"
}

export const trainingStorage = {
  getAll: async () => {
    const records = await getRows<any>(STORAGE_KEYS.TRAINING, COLLECTIONS.TRAINING)
    const completions = await getRows<any>(STORAGE_KEYS.TRAINING_COMPLETIONS, COLLECTIONS.TRAINING_COMPLETIONS)
    const profiles = await profileStorage.getAll()

    return records.map((record) => {
      const recordCompletions = completions.filter((completion) => completion.training_id === record.id)
      return {
        ...record,
        completions: recordCompletions.map((completion) => ({
          ...completion,
          user: profiles.find((profile) => profile.id === completion.user_id),
        })),
      }
    })
  },

  create: async (data: any) => {
    const newRecord = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.TRAINING, COLLECTIONS.TRAINING, newRecord)
  },

  update: async (id: string, data: any) =>
    updateRow<any>(STORAGE_KEYS.TRAINING, COLLECTIONS.TRAINING, id, {
      ...data,
      updated_at: new Date().toISOString(),
    }),

  delete: async (id: string) => {
    const completions = await getRows<any>(STORAGE_KEYS.TRAINING_COMPLETIONS, COLLECTIONS.TRAINING_COMPLETIONS)
    await Promise.all(
      completions
        .filter((completion) => completion.training_id === id)
        .map((completion) => deleteRow(STORAGE_KEYS.TRAINING_COMPLETIONS, COLLECTIONS.TRAINING_COMPLETIONS, completion.id)),
    )

    return deleteRow(STORAGE_KEYS.TRAINING, COLLECTIONS.TRAINING, id)
  },
}

export const profileStorage = {
  getAll: async () => getRows<any>(STORAGE_KEYS.PROFILES, COLLECTIONS.PROFILES),

  create: async (data: any) => {
    const newProfile = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.PROFILES, COLLECTIONS.PROFILES, newProfile)
  },

  update: async (id: string, data: any) =>
    updateRow<any>(STORAGE_KEYS.PROFILES, COLLECTIONS.PROFILES, id, {
      ...data,
      updated_at: new Date().toISOString(),
    }),

  delete: async (id: string) => deleteRow(STORAGE_KEYS.PROFILES, COLLECTIONS.PROFILES, id),
}

export const companySettingsStorage = {
  get: async () => {
    if (isSupabaseEnabled()) {
      const rows = await readCollection<any>(COLLECTIONS.COMPANY_SETTINGS)
      return rows.find((row) => row.id === "company") || null
    }

    if (typeof window === "undefined") return null
    const data = localStorage.getItem(STORAGE_KEYS.COMPANY_SETTINGS)
    return data ? JSON.parse(data) : null
  },

  save: async (settings: {
    companyName: string
    address: string
    preparerName: string
    reviewerName: string
    logo?: string
    phone?: string
    email?: string
  }) => {
    const row = {
      id: "company",
      ...settings,
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseEnabled()) {
      return upsertRecord(COLLECTIONS.COMPANY_SETTINGS, row)
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.COMPANY_SETTINGS, JSON.stringify(row))
    }
    return row
  },
}

export const changeLogStorage = {
  getAll: async () => {
    const logs = await getRows<ChangeLog>(STORAGE_KEYS.CHANGE_LOGS, COLLECTIONS.CHANGE_LOGS)
    return logs.sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
  },

  getByEntity: async (entityType: string, entityId: string) => {
    const logs = await changeLogStorage.getAll()
    return logs.filter((log) => log.entity_type === entityType && log.entity_id === entityId)
  },

  create: async (log: Omit<ChangeLog, "id" | "performed_at">) => {
    const currentUser = getCurrentUser()
    const newLog: ChangeLog = {
      ...log,
      id: generateId(),
      performed_by: currentUser?.id || log.performed_by || "system",
      performed_at: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.CHANGE_LOGS, COLLECTIONS.CHANGE_LOGS, newLog)
  },
}

export interface Notification {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  read: boolean
  created_at: string
  link?: string
}

export const notificationStorage = {
  getAll: async () => {
    const notifications = await getRows<Notification>(STORAGE_KEYS.NOTIFICATIONS, COLLECTIONS.NOTIFICATIONS)
    return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  getUnread: async () => {
    const notifications = await notificationStorage.getAll()
    return notifications.filter((notification) => !notification.read)
  },

  create: async (data: Omit<Notification, "id" | "created_at" | "read">) => {
    const newNotification: Notification = {
      ...data,
      id: generateId(),
      read: false,
      created_at: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.NOTIFICATIONS, COLLECTIONS.NOTIFICATIONS, newNotification)
  },

  markAsRead: async (id: string) => {
    await updateRow<Notification>(STORAGE_KEYS.NOTIFICATIONS, COLLECTIONS.NOTIFICATIONS, id, { read: true })
  },

  markAllAsRead: async () => {
    const notifications = await notificationStorage.getAll()
    await Promise.all(notifications.map((notification) => notificationStorage.markAsRead(notification.id)))
  },
}

export interface ComplianceItem {
  id: string
  iso_system: string
  category: string
  requirement: string
  description: string
  status: "not_started" | "in_progress" | "completed"
  evidence: string[]
  notes: string
  last_reviewed: string
  assigned_to?: string
}

export const complianceStorage = {
  getAll: async () => getRows<ComplianceItem>(STORAGE_KEYS.COMPLIANCE_CHECKLIST, COLLECTIONS.COMPLIANCE_CHECKLIST),

  getByISO: async (isoSystem: string) => {
    const items = await complianceStorage.getAll()
    return items.filter((item) => item.iso_system === isoSystem)
  },

  create: async (data: Omit<ComplianceItem, "id" | "last_reviewed">) => {
    const newItem: ComplianceItem = {
      ...data,
      id: generateId(),
      last_reviewed: new Date().toISOString(),
    }
    return createRow(STORAGE_KEYS.COMPLIANCE_CHECKLIST, COLLECTIONS.COMPLIANCE_CHECKLIST, newItem)
  },

  update: async (id: string, data: Partial<ComplianceItem>) =>
    updateRow<ComplianceItem>(STORAGE_KEYS.COMPLIANCE_CHECKLIST, COLLECTIONS.COMPLIANCE_CHECKLIST, id, {
      ...data,
      last_reviewed: new Date().toISOString(),
    }),

  initializeForISO: async (isoSystem: string) => {
    const existing = await complianceStorage.getByISO(isoSystem)
    if (existing.length > 0) return

    await Promise.all(getDefaultRequirements(isoSystem).map((requirement) => complianceStorage.create(requirement)))
  },
}

function getDefaultRequirements(isoSystem: string): Omit<ComplianceItem, "id" | "last_reviewed">[] {
  return [
    {
      iso_system: isoSystem,
      category: "Quality Management System",
      requirement: "QMS Documentation",
      description: "Establish and maintain documented quality management system",
      status: "not_started",
      evidence: [],
      notes: "",
    },
    {
      iso_system: isoSystem,
      category: "Management Responsibility",
      requirement: "Quality Policy",
      description: "Define and communicate quality policy",
      status: "not_started",
      evidence: [],
      notes: "",
    },
    {
      iso_system: isoSystem,
      category: "Resource Management",
      requirement: "Training & Competence",
      description: "Ensure personnel are competent based on education, training, and experience",
      status: "not_started",
      evidence: [],
      notes: "",
    },
    {
      iso_system: isoSystem,
      category: "Product Realization",
      requirement: "Document Control",
      description: "Control documents and records",
      status: "not_started",
      evidence: [],
      notes: "",
    },
    {
      iso_system: isoSystem,
      category: "Measurement & Analysis",
      requirement: "Internal Audits",
      description: "Conduct internal audits at planned intervals",
      status: "not_started",
      evidence: [],
      notes: "",
    },
    {
      iso_system: isoSystem,
      category: "Improvement",
      requirement: "Corrective Actions",
      description: "Take action to eliminate causes of nonconformities",
      status: "not_started",
      evidence: [],
      notes: "",
    },
  ]
}

if (typeof window !== "undefined") {
  initializeStorage()
}

export interface StoredFile {
  id: string
  name: string
  type: string
  size: number
  data: string
  uploadedAt: string
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export interface DocumentRevision {
  id: string
  document_id: string
  version: string
  changes: string
  revised_by: string
  revised_at: string
  file_id?: string
  file_url?: string
}

export interface ChangeLog {
  id: string
  entity_type: "document" | "capa" | "audit" | "risk" | "training"
  entity_id: string
  action: "created" | "updated" | "deleted" | "approved" | "rejected"
  changes: Record<string, any>
  performed_by: string
  performed_at: string
}
