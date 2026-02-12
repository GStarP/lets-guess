import { LOCAL_STORAGE_KEY, SCHEMA_VERSION } from './constants'
import type { PuzzleDraftDocument, PuzzleDraftItem } from '../types'

function isValidDraftItem(item: unknown): item is PuzzleDraftItem {
  if (!item || typeof item !== 'object') {
    return false
  }

  const candidate = item as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.imageId === 'string' &&
    typeof candidate.correctName === 'string'
  )
}

function isValidDraftDocument(data: unknown): data is PuzzleDraftDocument {
  if (!data || typeof data !== 'object') {
    return false
  }

  const candidate = data as Record<string, unknown>

  if (
    typeof candidate.schemaVersion !== 'string' ||
    typeof candidate.updatedAt !== 'number' ||
    !Array.isArray(candidate.items)
  ) {
    return false
  }

  return candidate.items.every(isValidDraftItem)
}

export function loadDraftFromLocalStorage(): PuzzleDraftDocument | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isValidDraftDocument(parsed)) {
      return null
    }

    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveDraftToLocalStorage(items: PuzzleDraftItem[]): void {
  const document: PuzzleDraftDocument = {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: Date.now(),
    items,
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(document))
}

export function clearDraftFromLocalStorage(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}
