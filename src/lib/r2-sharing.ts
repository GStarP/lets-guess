import { AwsClient } from 'aws4fetch'
import type { R2Credentials } from '../types'

const PUT_EXPIRES_SECONDS = 300 // 5 分钟，仅用于本次上传
const GET_EXPIRES_SECONDS = 86400 // 1 天，作为分享链接

/** 生成短文件名：lg-<base36时间戳>-<4位随机hex>.json */
function generateFileName(): string {
  const ts = Date.now().toString(36)
  const rand = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0')
  return `lg-${ts}-${rand}.json`
}

function buildObjectUrl(endpoint: string, bucket: string, fileName: string): string {
  const base = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
  return `${base}/${bucket}/${fileName}`
}

function buildClient(credentials: R2Credentials): AwsClient {
  return new AwsClient({
    service: 's3',
    region: 'auto',
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  })
}

/**
 * 将题目 JSON 上传到 R2，返回预签名 GET URL（有效期 1 天）。
 */
export async function uploadAndGetShareUrl(
  credentials: R2Credentials,
  jsonContent: string,
): Promise<string> {
  const client = buildClient(credentials)
  const fileName = generateFileName()
  const objectUrl = buildObjectUrl(credentials.endpoint, credentials.bucket, fileName)

  // 1. 生成预签名 PUT URL 并上传
  const signedPutRequest = await client.sign(
    new Request(`${objectUrl}?X-Amz-Expires=${PUT_EXPIRES_SECONDS}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }),
    { aws: { signQuery: true } },
  )

  const putResponse = await fetch(signedPutRequest.url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: jsonContent,
  })

  if (!putResponse.ok) {
    throw new Error(`上传失败（${putResponse.status}），请检查凭证与 CORS 配置`)
  }

  // 2. 生成预签名 GET URL 作为分享链接
  const signedGetRequest = await client.sign(
    new Request(`${objectUrl}?X-Amz-Expires=${GET_EXPIRES_SECONDS}`),
    { aws: { signQuery: true } },
  )

  return signedGetRequest.url.toString()
}

/**
 * 将预签名 GET URL 编码为 Base64URL 字符串，拼入 hash 参数。
 */
export function buildShareLink(presignedGetUrl: string): string {
  const encoded = btoa(presignedGetUrl)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const origin = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
  return `${origin}#share=${encoded}`
}

/**
 * 从 URL hash 中提取预签名 GET URL，解码失败则返回 null。
 */
export function extractShareUrlFromHash(): string | null {
  const hash = window.location.hash
  if (!hash) {
    return null
  }

  const params = new URLSearchParams(hash.slice(1))
  const encoded = params.get('share')
  if (!encoded) {
    return null
  }

  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    return atob(base64)
  } catch {
    return null
  }
}

/**
 * 清除 URL hash 中的 share 参数，不刷新页面。
 */
export function clearShareHash(): void {
  const hash = window.location.hash
  if (!hash) {
    return
  }

  const params = new URLSearchParams(hash.slice(1))
  params.delete('share')

  const remaining = params.toString()
  const newUrl = window.location.pathname + window.location.search + (remaining ? `#${remaining}` : '')
  window.history.replaceState(null, '', newUrl)
}

/**
 * 从预签名 GET URL 下载题目 JSON 字符串。
 */
export async function downloadSharedJson(presignedGetUrl: string): Promise<string> {
  const response = await fetch(presignedGetUrl)

  if (!response.ok) {
    throw new Error(`下载失败（${response.status}），链接可能已失效`)
  }

  return response.text()
}
