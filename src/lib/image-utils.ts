import { SUPPORTED_IMAGE_TYPES } from './constants'

const SUPPORTED_IMAGE_TYPE_SET = new Set<string>(SUPPORTED_IMAGE_TYPES)

export function isSupportedImageMimeType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPE_SET.has(mimeType)
}

export async function readImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(blob)

  try {
    if ('createImageBitmap' in window) {
      const bitmap = await createImageBitmap(blob)
      const dimensions = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return dimensions
    }

    const image = await loadImageFromUrl(objectUrl)
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('图片转换失败'))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => reject(new Error('图片转换失败'))
    reader.readAsDataURL(blob)
  })
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',')
  if (!dataUrl.startsWith('data:') || commaIndex === -1) {
    throw new Error('图片数据格式错误')
  }

  const metadata = dataUrl.slice(5, commaIndex)
  const payload = dataUrl.slice(commaIndex + 1)

  if (!metadata.includes(';base64')) {
    throw new Error('仅支持 base64 图片数据')
  }

  const mimeType = metadata.replace(';base64', '')
  if (!mimeType || !isSupportedImageMimeType(mimeType)) {
    throw new Error('图片格式不受支持，仅支持 JPEG/PNG/WebP')
  }

  try {
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return new Blob([bytes], { type: mimeType })
  } catch {
    throw new Error('图片数据已损坏')
  }
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = url
  })
}
