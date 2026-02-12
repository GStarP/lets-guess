import { DB_NAME, DB_VERSION, IMAGE_STORE_NAME } from './constants'
import type { StoredImageRecord } from '../types'

let databasePromise: Promise<IDBDatabase> | null = null

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
  })
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise
  }

  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前浏览器不支持 IndexedDB'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('打开 IndexedDB 失败'))
  })

  return databasePromise
}

export async function putImage(record: StoredImageRecord): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
  const store = transaction.objectStore(IMAGE_STORE_NAME)
  store.put(record)
  await transactionComplete(transaction)
}

export async function getImage(id: string): Promise<StoredImageRecord | null> {
  const database = await openDatabase()
  const transaction = database.transaction(IMAGE_STORE_NAME, 'readonly')
  const store = transaction.objectStore(IMAGE_STORE_NAME)
  const result = await requestToPromise(store.get(id))
  await transactionComplete(transaction)
  return (result as StoredImageRecord | undefined) ?? null
}

export async function getAllImages(): Promise<StoredImageRecord[]> {
  const database = await openDatabase()
  const transaction = database.transaction(IMAGE_STORE_NAME, 'readonly')
  const store = transaction.objectStore(IMAGE_STORE_NAME)
  const result = await requestToPromise(store.getAll())
  await transactionComplete(transaction)
  return result as StoredImageRecord[]
}

export async function deleteImage(id: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
  const store = transaction.objectStore(IMAGE_STORE_NAME)
  store.delete(id)
  await transactionComplete(transaction)
}

export async function clearImages(): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
  const store = transaction.objectStore(IMAGE_STORE_NAME)
  store.clear()
  await transactionComplete(transaction)
}
