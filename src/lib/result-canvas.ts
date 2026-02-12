import { loadImageFromUrl } from './image-utils'
import type { ResultEntry } from '../types'

const CANVAS_WIDTH = 1080
const CANVAS_PADDING = 40
const GRID_GAP = 24
const CARD_RADIUS = 20
const CARD_PADDING = 16
const FOOTER_HEIGHT = 96

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
  const columns = entries.length > 1 ? 2 : 1
  const rows = Math.max(1, Math.ceil(entries.length / columns))
  const cardWidth =
    (CANVAS_WIDTH - CANVAS_PADDING * 2 - GRID_GAP * (columns - 1)) / columns
  const imageHeight = Math.round(cardWidth * 0.74)
  const nameLineHeight = 38
  const reasonLineHeight = 30
  const reasonMaxLines = 3
  const cardHeight = imageHeight + CARD_PADDING * 2 + nameLineHeight + reasonLineHeight * reasonMaxLines + 24

  const canvas = document.createElement('canvas')
  const totalHeight =
    CANVAS_PADDING + rows * cardHeight + GRID_GAP * (rows - 1) + FOOTER_HEIGHT

  canvas.width = CANVAS_WIDTH
  canvas.height = totalHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 初始化失败')
  }

  context.fillStyle = '#f8fafc'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const loadedImages = await loadImages(entries)

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const image = loadedImages[index]
    const row = Math.floor(index / columns)
    const column = index % columns
    const left = CANVAS_PADDING + column * (cardWidth + GRID_GAP)
    const top = CANVAS_PADDING + row * (cardHeight + GRID_GAP)

    drawRoundedRect(context, left, top, cardWidth, cardHeight, CARD_RADIUS)
    context.fillStyle = '#ffffff'
    context.fill()

    context.strokeStyle = '#e2e8f0'
    context.lineWidth = 1.5
    context.stroke()

    const imageX = left + CARD_PADDING
    const imageY = top + CARD_PADDING
    const imageWidth = cardWidth - CARD_PADDING * 2
    const imageInnerHeight = imageHeight

    drawRoundedRect(context, imageX, imageY, imageWidth, imageInnerHeight, 14)
    context.save()
    context.clip()
    context.fillStyle = '#e5e7eb'
    context.fillRect(imageX, imageY, imageWidth, imageInnerHeight)

    if (image) {
      drawImageContain(context, image, imageX, imageY, imageWidth, imageInnerHeight)
    }
    context.restore()

    const contentX = imageX
    const contentWidth = imageWidth
    const contentCenterX = contentX + contentWidth / 2
    const nameTop = imageY + imageInnerHeight + 44
    const reasonTop = nameTop + 44

    context.fillStyle = '#111827'
    context.font = '600 32px Outfit'
    drawWrappedText(
      context,
      entry.selectedName || '未选择',
      contentCenterX,
      nameTop,
      contentWidth,
      nameLineHeight,
      1,
      'center',
    )

    context.fillStyle = '#4b5563'
    context.font = '400 26px Outfit'
    if (entry.reason.trim()) {
      drawWrappedText(
        context,
        entry.reason,
        contentCenterX,
        reasonTop,
        contentWidth,
        reasonLineHeight,
        reasonMaxLines,
        'center',
      )
    }
  }

  context.fillStyle = '#6b7280'
  context.font = '500 24px Outfit'
  context.textAlign = 'center'
  context.fillText('lets-guess.pages.dev', canvas.width / 2, canvas.height - 34)
  context.textAlign = 'start'

  return canvas
}
