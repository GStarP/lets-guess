import { loadImageFromUrl } from './image-utils'
import type { ResultEntry } from '../types'

const CANVAS_WIDTH = 1080
const CANVAS_PADDING = 32
const GRID_GAP = 16
const IMAGE_RADIUS = 10
const NAME_PILL_HEIGHT = 36
const NAME_PILL_MARGIN_TOP = 12
const NAME_FONT_SIZE = 24
const NAME_LINE_HEIGHT = 24
const NAME_BASELINE_Y_OFFSET = 26
const REASON_MARGIN_TOP = 8
const REASON_LINE_HEIGHT = 22
const REASON_MAX_LINES = 2
const FOOTER_HEIGHT = 60

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  align: CanvasTextAlign = 'start',
): void {
  const normalizedText = text.trim()
  if (!normalizedText) {
    return
  }

  const characters = normalizedText.split('')
  const lines: string[] = []
  let currentLine = ''

  for (const character of characters) {
    const candidate = currentLine + character
    if (context.measureText(candidate).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = character

      if (lines.length >= maxLines) {
        break
      }

      continue
    }

    currentLine = candidate
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine)
  }

  const previousAlign = context.textAlign
  context.textAlign = align

  lines.slice(0, maxLines).forEach((line, index) => {
    const isTruncated = index === maxLines - 1 && lines.length > maxLines
    context.fillText(isTruncated ? `${line}...` : line, x, y + index * lineHeight)
  })

  context.textAlign = previousAlign
}

async function loadImages(entries: ResultEntry[]): Promise<Array<HTMLImageElement | null>> {
  return Promise.all(
    entries.map(async (entry) => {
      try {
        return await loadImageFromUrl(entry.imageUrl)
      } catch {
        return null
      }
    }),
  )
}

function drawImageContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return
  }

  const scale = Math.min(width / sourceWidth, height / sourceHeight)
  const renderedWidth = sourceWidth * scale
  const renderedHeight = sourceHeight * scale
  const renderedX = x + (width - renderedWidth) / 2
  const renderedY = y + (height - renderedHeight) / 2

  context.drawImage(image, renderedX, renderedY, renderedWidth, renderedHeight)
}

export async function renderResultCanvas(
  entries: ResultEntry[],
): Promise<HTMLCanvasElement> {
  const columns = 3
  const rows = entries.length > 0 ? Math.ceil(entries.length / columns) : 0

  const availableWidth = CANVAS_WIDTH - (CANVAS_PADDING * 2) - (GRID_GAP * (columns - 1))
  const cellWidth = Math.floor(availableWidth / columns)
  const imageHeight = cellWidth
  const baseRowItemHeight = imageHeight + NAME_PILL_MARGIN_TOP + NAME_PILL_HEIGHT
  const reasonBlockHeight = REASON_MARGIN_TOP + (REASON_LINE_HEIGHT * REASON_MAX_LINES)

  const rowHasReason = Array.from({ length: rows }, (_, rowIndex) => {
    const rowEntries = entries.slice(rowIndex * columns, (rowIndex + 1) * columns)
    return rowEntries.some((entry) => entry.reason.trim().length > 0)
  })

  const rowHeights = rowHasReason.map((hasReason) =>
    hasReason ? baseRowItemHeight + reasonBlockHeight : baseRowItemHeight,
  )

  const rowTops: number[] = []
  let nextTop = CANVAS_PADDING

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    rowTops.push(nextTop)
    nextTop += rowHeights[rowIndex] + GRID_GAP
  }

  const contentHeight = rows > 0 ? nextTop - CANVAS_PADDING - GRID_GAP : 0

  const canvas = document.createElement('canvas')
  const totalHeight = CANVAS_PADDING + contentHeight + FOOTER_HEIGHT

  canvas.width = CANVAS_WIDTH
  canvas.height = totalHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 初始化失败')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const loadedImages = await loadImages(entries)

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const image = loadedImages[index]
    const row = Math.floor(index / columns)
    const column = index % columns

    const contentLeft = CANVAS_PADDING + column * (cellWidth + GRID_GAP)
    const contentTop = rowTops[row]
    const contentWidth = cellWidth

    drawRoundedRect(context, contentLeft, contentTop, contentWidth, imageHeight, IMAGE_RADIUS)
    context.save()
    context.clip()

    context.fillStyle = '#f3f4f6'
    context.fillRect(contentLeft, contentTop, contentWidth, imageHeight)

    if (image) {
      drawImageContain(context, image, contentLeft, contentTop, contentWidth, imageHeight)
    }
    context.restore()

    const pillY = contentTop + imageHeight + NAME_PILL_MARGIN_TOP
    const pillColor = entry.isCorrect ? '#dcfce7' : '#fee2e2'
    const textColor = entry.isCorrect ? '#166534' : '#991b1b'

    drawRoundedRect(context, contentLeft, pillY, contentWidth, NAME_PILL_HEIGHT, 6)
    context.fillStyle = pillColor
    context.fill()

    context.fillStyle = textColor
    context.font = `600 ${NAME_FONT_SIZE}px Outfit`
    drawWrappedText(
      context,
      entry.selectedName || '未选择',
      contentLeft + contentWidth / 2,
      pillY + NAME_BASELINE_Y_OFFSET,
      contentWidth - 16,
      NAME_LINE_HEIGHT,
      1,
      'center',
    )

    if (!rowHasReason[row]) {
      continue
    }

    const reasonY = pillY + NAME_PILL_HEIGHT + REASON_MARGIN_TOP
    context.fillStyle = '#6b7280'
    context.font = '400 16px Outfit'

    if (entry.reason && entry.reason.trim()) {
      drawWrappedText(
        context,
        entry.reason,
        contentLeft + contentWidth / 2,
        reasonY + 14,
        contentWidth,
        REASON_LINE_HEIGHT,
        REASON_MAX_LINES,
        'center',
      )
    }
  }

  // Footer
  context.fillStyle = '#9ca3af'
  context.font = '500 22px Outfit'
  context.textAlign = 'center'
  context.fillText('lets-guess.pages.dev', canvas.width / 2, canvas.height - 24)
  context.textAlign = 'start'

  return canvas
}
