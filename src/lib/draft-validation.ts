import { MAX_IMAGE_COUNT, MIN_IMAGE_COUNT } from './constants'
import { normalizeName } from './name-utils'
import type { PuzzleDraftItem } from '../types'

export type DraftValidation = {
  canStart: boolean
  countError: string | null
  duplicateValues: string[]
  duplicateNameIds: Set<string>
  emptyNameIds: Set<string>
  summary: string | null
}

export function validateDraftItems(items: PuzzleDraftItem[]): DraftValidation {
  const emptyNameIds = new Set<string>()
  const duplicateNameIds = new Set<string>()
  const duplicateValues = new Set<string>()
  const nameToIds = new Map<string, string[]>()

  for (const item of items) {
    const trimmed = item.correctName.trim()

    if (!trimmed) {
      emptyNameIds.add(item.id)
      continue
    }

    const normalized = normalizeName(trimmed)
    const existing = nameToIds.get(normalized)

    if (existing) {
      existing.push(item.id)
      continue
    }

    nameToIds.set(normalized, [item.id])
  }

  for (const [normalizedName, ids] of nameToIds.entries()) {
    if (ids.length < 2) {
      continue
    }

    duplicateValues.add(normalizedName)
    for (const id of ids) {
      duplicateNameIds.add(id)
    }
  }

  let countError: string | null = null
  if (items.length < MIN_IMAGE_COUNT) {
    countError = `至少需要 ${MIN_IMAGE_COUNT} 张图片`
  } else if (items.length > MAX_IMAGE_COUNT) {
    countError = `最多支持 ${MAX_IMAGE_COUNT} 张图片`
  }

  let summary: string | null = null
  if (countError) {
    summary = countError
  } else if (emptyNameIds.size > 0) {
    summary = '请填写所有名称'
  } else if (duplicateNameIds.size > 0) {
    summary = '名称不能重复'
  }

  return {
    canStart: !countError && emptyNameIds.size === 0 && duplicateNameIds.size === 0,
    countError,
    duplicateValues: [...duplicateValues],
    duplicateNameIds,
    emptyNameIds,
    summary,
  }
}
