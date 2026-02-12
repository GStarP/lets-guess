export type AppView = 'setup' | 'game' | 'result'

export type ToastTone = 'error' | 'info' | 'success'

export type ToastMessage = {
  type: ToastTone
  text: string
}

export type PuzzleDraftItem = {
  id: string
  imageId: string
  correctName: string
}

export type PuzzleDraftDocument = {
  schemaVersion: string
  updatedAt: number
  items: PuzzleDraftItem[]
}

export type StoredImageRecord = {
  id: string
  blob: Blob
  mimeType: string
  width: number
  height: number
  createdAt: number
}

export type DraftItemWithPreview = PuzzleDraftItem & {
  previewUrl: string | null
}

export type GameSessionState = {
  items: PuzzleDraftItem[]
  currentIndex: number
  nameOrder: string[]
  selectedNameByImageId: Record<string, string | null>
  reasonByImageId: Record<string, string>
}

export type ExportPuzzleItem = {
  id: string
  correctName: string
  imageData: string
  mimeType: string
}

export type ExportPuzzleDocument = {
  schemaVersion: string
  updatedAt: number
  items: ExportPuzzleItem[]
}

export type ResultEntry = {
  id: string
  imageUrl: string
  selectedName: string
  reason: string
  isCorrect: boolean
}
