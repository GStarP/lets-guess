import { MAX_IMAGE_COUNT, MIN_IMAGE_COUNT, SCHEMA_VERSION } from './constants'
import { dataUrlToBlob } from './image-utils'
import { normalizeName } from './name-utils'
import type { ExportPuzzleDocument, ExportPuzzleItem, PuzzleDraftItem } from '../types'

export type ParsedImportItem = {
  id: string
  correctName: string
  blob: Blob
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`字段 ${field} 缺失或格式错误`)
  }

  return value
}

export function parseImportDocument(rawText: string): ParsedImportItem[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('JSON 格式错误')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('导入数据格式错误')
  }

  const root = parsed as Record<string, unknown>
  const schemaVersion = assertString(root.schemaVersion, 'schemaVersion')

  if (schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`版本不支持，当前仅支持 ${SCHEMA_VERSION}`)
  }

  if (!Array.isArray(root.items)) {
    throw new Error('字段 items 缺失或格式错误')
  }

  if (root.items.length < MIN_IMAGE_COUNT || root.items.length > MAX_IMAGE_COUNT) {
    throw new Error(`题目数量必须在 ${MIN_IMAGE_COUNT}-${MAX_IMAGE_COUNT} 张之间`)
  }

  const ids = new Set<string>()
  const names = new Set<string>()

  const result = root.items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`第 ${index + 1} 条数据格式错误`)
    }

    const row = item as Record<string, unknown>
    const id = assertString(row.id, `items[${index}].id`)
    const correctName = assertString(row.correctName, `items[${index}].correctName`).trim()
    const imageData = assertString(row.imageData, `items[${index}].imageData`)

    if (!id) {
      throw new Error(`第 ${index + 1} 条数据 id 不能为空`)
    }

    if (ids.has(id)) {
      throw new Error(`第 ${index + 1} 条数据 id 重复`)
    }
    ids.add(id)

    if (!correctName) {
      throw new Error(`第 ${index + 1} 条数据名称不能为空`)
    }

    const normalized = normalizeName(correctName)
    if (names.has(normalized)) {
      throw new Error(`第 ${index + 1} 条数据名称重复`)
    }
    names.add(normalized)

    return {
      id,
      correctName,
      blob: dataUrlToBlob(imageData),
    }
  })

  return result
}

export function buildExportDocument(
  items: PuzzleDraftItem[],
  imageDataByImageId: Record<string, { dataUrl: string; mimeType: string }>,
): ExportPuzzleDocument {
  const exportItems: ExportPuzzleItem[] = items.map((item) => {
    const image = imageDataByImageId[item.imageId]

    if (!image) {
      throw new Error('存在缺失的图片数据，无法导出')
    }

    return {
      id: item.id,
      correctName: item.correctName.trim(),
      imageData: image.dataUrl,
      mimeType: image.mimeType,
    }
  })

  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: Date.now(),
    items: exportItems,
  }
}
