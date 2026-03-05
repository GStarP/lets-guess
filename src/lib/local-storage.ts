import { LOCAL_STORAGE_KEY, R2_CREDENTIALS_KEY, SCHEMA_VERSION, SETUP_MODE_KEY } from './constants'
import type { PuzzleDraftDocument, PuzzleDraftItem, R2Credentials } from '../types'

export type SetupMode = 'play' | 'edit'

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

export function loadR2CredentialsFromLocalStorage(): R2Credentials | null {
  const raw = localStorage.getItem(R2_CREDENTIALS_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const c = parsed as Record<string, unknown>
    if (
      typeof c.endpoint !== 'string' ||
      typeof c.bucket !== 'string' ||
      typeof c.accessKeyId !== 'string' ||
      typeof c.secretAccessKey !== 'string'
    ) {
      return null
    }

    return {
      endpoint: c.endpoint,
      bucket: c.bucket,
      accessKeyId: c.accessKeyId,
      secretAccessKey: c.secretAccessKey,
    }
  } catch {
    return null
  }
}

export function saveR2CredentialsToLocalStorage(credentials: R2Credentials): void {
  localStorage.setItem(R2_CREDENTIALS_KEY, JSON.stringify(credentials))
}

export function loadSetupModeFromLocalStorage(): SetupMode | null {
  const raw = localStorage.getItem(SETUP_MODE_KEY)
  if (raw === 'play' || raw === 'edit') {
    return raw
  }

  return null
}

export function saveSetupModeToLocalStorage(mode: SetupMode): void {
  localStorage.setItem(SETUP_MODE_KEY, mode)
}
