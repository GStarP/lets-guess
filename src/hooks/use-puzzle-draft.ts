import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_IMAGE_COUNT } from '../lib/constants'
import { validateDraftItems } from '../lib/draft-validation'
import { deleteImage, getImage, putImage, clearImages } from '../lib/indexed-db'
import {
  clearDraftFromLocalStorage,
  loadDraftFromLocalStorage,
  saveDraftToLocalStorage,
} from '../lib/local-storage'
import { blobToDataUrl, isSupportedImageMimeType, readImageDimensions, triggerDownload } from '../lib/image-utils'
import { buildExportDocument, parseImportDocument } from '../lib/import-export'
import type { DraftItemWithPreview, PuzzleDraftItem, ToastMessage } from '../types'

type UsePuzzleDraftResult = {
  items: PuzzleDraftItem[]
  itemsWithPreview: DraftItemWithPreview[]
  previewUrlByImageId: Record<string, string>
  isBusy: boolean
  message: ToastMessage | null
  validation: ReturnType<typeof validateDraftItems>
  uploadImages: (files: File[]) => Promise<void>
  updateItemName: (id: string, name: string) => void
  removeItem: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  importFromJson: (file: File | null) => Promise<void>
  exportToJson: () => Promise<void>
  clearMessage: () => void
  pushMessage: (nextMessage: ToastMessage) => void
}

function revokeUrls(urls: string[]): void {
  for (const url of urls) {
    URL.revokeObjectURL(url)
  }
}

export function usePuzzleDraft(): UsePuzzleDraftResult {
  const [items, setItems] = useState<PuzzleDraftItem[]>([])
  const [previewUrlByImageId, setPreviewUrlByImageId] = useState<Record<string, string>>({})
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<ToastMessage | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const previewMapRef = useRef<Record<string, string>>({})

  const replacePreviewMap = useCallback((nextMap: Record<string, string>) => {
    const current = previewMapRef.current
    const nextUrlSet = new Set(Object.values(nextMap))
    const removedUrlSet = new Set<string>()

    for (const url of Object.values(current)) {
      if (!nextUrlSet.has(url)) {
        removedUrlSet.add(url)
      }
    }

    revokeUrls([...removedUrlSet])
    previewMapRef.current = nextMap
    setPreviewUrlByImageId(nextMap)
  }, [])

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      const draft = loadDraftFromLocalStorage()

      if (!draft) {
        if (!cancelled) {
          setHydrated(true)
        }
        return
      }

      const loadedItems: PuzzleDraftItem[] = []
      const loadedPreviewMap: Record<string, string> = {}
      const missingItems: string[] = []

      for (const item of draft.items) {
        try {
          const image = await getImage(item.imageId)

          if (!image) {
            missingItems.push(item.id)
            continue
          }

          loadedItems.push(item)
          loadedPreviewMap[item.imageId] = URL.createObjectURL(image.blob)
        } catch {
          missingItems.push(item.id)
        }
      }

      if (cancelled) {
        revokeUrls(Object.values(loadedPreviewMap))
        return
      }

      setItems(loadedItems)
      replacePreviewMap(loadedPreviewMap)

      if (missingItems.length > 0) {
        setMessage({ type: 'error', text: '部分图片数据损坏，已自动移除异常项' })
      }

      setHydrated(true)
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [replacePreviewMap])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (items.length === 0) {
      clearDraftFromLocalStorage()
      return
    }

    saveDraftToLocalStorage(items)
  }, [hydrated, items])

  useEffect(() => {
    return () => {
      revokeUrls(Object.values(previewMapRef.current))
    }
  }, [])

  const uploadImages = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return
      }

      if (items.length >= MAX_IMAGE_COUNT) {
        setMessage({ type: 'error', text: `已达到图片上限 ${MAX_IMAGE_COUNT} 张` })
        return
      }

      setIsBusy(true)

      const nextItems = [...items]
      const nextPreviewMap = { ...previewMapRef.current }
      let invalidTypeCount = 0
      let failedCount = 0
      let reachedLimit = false

      for (const file of files) {
        if (nextItems.length >= MAX_IMAGE_COUNT) {
          reachedLimit = true
          break
        }

        if (!isSupportedImageMimeType(file.type)) {
          invalidTypeCount += 1
          continue
        }

        const id = `img_${crypto.randomUUID()}`

        try {
          const dimensions = await readImageDimensions(file)
          await putImage({
            id,
            blob: file,
            mimeType: file.type,
            width: dimensions.width,
            height: dimensions.height,
            createdAt: Date.now(),
          })

          nextItems.push({
            id,
            imageId: id,
            correctName: '',
          })

          nextPreviewMap[id] = URL.createObjectURL(file)
        } catch {
          failedCount += 1
        }
      }

      setItems(nextItems)
      replacePreviewMap(nextPreviewMap)

      const feedback: string[] = []

      if (invalidTypeCount > 0) {
        feedback.push(`忽略 ${invalidTypeCount} 个非图片文件`)
      }

      if (failedCount > 0) {
        feedback.push(`${failedCount} 张图片写入失败，请重试`)
      }

      if (reachedLimit) {
        feedback.push(`最多支持 ${MAX_IMAGE_COUNT} 张图片`)
      }

      if (feedback.length > 0) {
        setMessage({ type: 'error', text: feedback.join('；') })
      }

      setIsBusy(false)
    },
    [items, replacePreviewMap],
  )

  const updateItemName = useCallback((id: string, name: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item
        }

        return {
          ...item,
          correctName: name,
        }
      }),
    )
  }, [])

  const removeItem = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id)
      if (!target) {
        return
      }

      setIsBusy(true)

      try {
        await deleteImage(target.imageId)

        setItems((current) => current.filter((item) => item.id !== id))

        const nextPreviewMap = { ...previewMapRef.current }
        delete nextPreviewMap[target.imageId]
        replacePreviewMap(nextPreviewMap)
      } catch {
        setMessage({ type: 'error', text: '删除失败，请稍后重试' })
      }

      setIsBusy(false)
    },
    [items, replacePreviewMap],
  )

  const clearAll = useCallback(async () => {
    setIsBusy(true)

    try {
      await clearImages()
      setItems([])
      replacePreviewMap({})
      clearDraftFromLocalStorage()
      setMessage({ type: 'success', text: '题目数据已清空' })
    } catch {
      setMessage({ type: 'error', text: '清空失败，请稍后重试' })
    }

    setIsBusy(false)
  }, [replacePreviewMap])

  const importFromJson = useCallback(
    async (file: File | null) => {
      if (!file) {
        return
      }

      setIsBusy(true)

      try {
        const parsedItems = parseImportDocument(await file.text())

        const nextItems: PuzzleDraftItem[] = []
        const nextPreviewMap: Record<string, string> = {}

        await clearImages()

        for (const item of parsedItems) {
          const dimensions = await readImageDimensions(item.blob)

          await putImage({
            id: item.id,
            blob: item.blob,
            mimeType: item.blob.type,
            width: dimensions.width,
            height: dimensions.height,
            createdAt: Date.now(),
          })

          nextItems.push({
            id: item.id,
            imageId: item.id,
            correctName: item.correctName,
          })

          nextPreviewMap[item.id] = URL.createObjectURL(item.blob)
        }

        setItems(nextItems)
        replacePreviewMap(nextPreviewMap)
        setMessage({ type: 'success', text: `导入成功，共 ${nextItems.length} 张图片` })
      } catch (error) {
        const detail = error instanceof Error ? error.message : '未知错误'
        setMessage({ type: 'error', text: `导入失败：${detail}` })
      }

      setIsBusy(false)
    },
    [replacePreviewMap],
  )

  const exportToJson = useCallback(async () => {
    if (items.length === 0) {
      setMessage({ type: 'info', text: '当前没有可导出的题目' })
      return
    }

    setIsBusy(true)

    try {
      const imageDataByImageId: Record<string, { dataUrl: string; mimeType: string }> = {}

      for (const item of items) {
        const image = await getImage(item.imageId)

        if (!image) {
          throw new Error('存在丢失图片，请先重新上传后再导出')
        }

        imageDataByImageId[item.imageId] = {
          dataUrl: await blobToDataUrl(image.blob),
          mimeType: image.mimeType,
        }
      }

      const payload = buildExportDocument(items, imageDataByImageId)
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      triggerDownload(blob, `lets-guess-puzzle-${Date.now()}.json`)
      setMessage({ type: 'success', text: '导出成功' })
    } catch (error) {
      const detail = error instanceof Error ? error.message : '未知错误'
      setMessage({ type: 'error', text: `导出失败：${detail}` })
    }

    setIsBusy(false)
  }, [items])

  const clearMessage = useCallback(() => {
    setMessage(null)
  }, [])

  const pushMessage = useCallback((nextMessage: ToastMessage) => {
    setMessage(nextMessage)
  }, [])

  const validation = useMemo(() => validateDraftItems(items), [items])

  const itemsWithPreview = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        previewUrl: previewUrlByImageId[item.imageId] ?? null,
      })),
    [items, previewUrlByImageId],
  )

  return {
    items,
    itemsWithPreview,
    previewUrlByImageId,
    isBusy,
    message,
    validation,
    uploadImages,
    updateItemName,
    removeItem,
    clearAll,
    importFromJson,
    exportToJson,
    clearMessage,
    pushMessage,
  }
}
