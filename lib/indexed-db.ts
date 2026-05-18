// IndexedDB wrapper for storing large files
const DB_NAME = "qms_files_db"
const DB_VERSION = 1
const STORE_NAME = "files"

let db: IDBDatabase | null = null

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

// Store a file in IndexedDB
export async function storeFile(
  id: string,
  data: string,
  metadata: { name: string; type: string; size: number },
): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    const fileData = {
      id,
      data,
      ...metadata,
      timestamp: new Date().toISOString(),
    }

    const request = store.put(fileData)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Retrieve a file from IndexedDB
export async function getFile(id: string): Promise<{
  data: string
  name: string
  type: string
  size: number
} | null> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }
    request.onerror = () => reject(request.error)
  })
}

// Delete a file from IndexedDB
export async function deleteFile(id: string): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get all file IDs
export async function getAllFileIds(): Promise<string[]> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAllKeys()

    request.onsuccess = () => {
      resolve(request.result as string[])
    }
    request.onerror = () => reject(request.error)
  })
}

// Clear all files
export async function clearAllFiles(): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
