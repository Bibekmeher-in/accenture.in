import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"]

// Storage provider configuration
export type StorageProviderType = "local" | "s3" | "vercel-blob"

export function getStorageProvider(): StorageProviderType {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return "vercel-blob"
  }
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    return "s3"
  }
  return "local"
}

const LOCAL_STORAGE_DIR = process.env.RESUME_STORAGE_DIR 
  ? path.resolve(process.env.RESUME_STORAGE_DIR)
  : path.join(process.cwd(), "storage", "resumes")

/**
 * Ensures the local storage directory exists.
 */
async function ensureLocalStorageDir() {
  await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true })
}

/**
 * Validates and sanitizes a file extension against allowed resume formats.
 */
export function getSafeExtension(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : null
}

/**
 * AWS Signature Version 4 Helper for S3-Compatible Object Storage (No AWS SDK dependency required)
 */
function getS3SignatureKey(key: string, dateStamp: string, region: string, service: string) {
  const kDate = crypto.createHmac("sha256", "AWS4" + key).update(dateStamp).digest()
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest()
  const kService = crypto.createHmac("sha256", kRegion).update(service).digest()
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest()
  return kSigning
}

async function s3Request(
  method: "PUT" | "GET" | "DELETE",
  storageKey: string,
  body?: Buffer,
  contentType?: string
): Promise<{ ok: boolean; status: number; buffer?: Buffer }> {
  const bucket = process.env.S3_BUCKET!
  const region = process.env.S3_REGION || "us-east-1"
  const accessKeyId = process.env.S3_ACCESS_KEY_ID!
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!
  const endpoint = process.env.S3_ENDPOINT || `https://${bucket}.s3.${region}.amazonaws.com`

  const host = new URL(endpoint).host
  const url = `${endpoint.replace(/\/$/, "")}/${storageKey}`

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.substring(0, 8)

  const payloadHash = crypto.createHash("sha256").update(body || "").digest("hex")

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  }
  if (contentType) headers["content-type"] = contentType

  const signedHeaders = Object.keys(headers).sort().join(";")
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(k => `${k}:${headers[k]}\n`)
    .join("")

  const canonicalRequest = [
    method,
    `/${storageKey}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n")

  const signingKey = getS3SignatureKey(secretAccessKey, dateStamp, region, "s3")
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex")

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  headers["authorization"] = authHeader

  const res = await fetch(url, {
    method,
    headers,
    body: method === "PUT" ? (body as unknown as BodyInit) : undefined,
  })

  if (method === "GET" && res.ok) {
    const arrayBuf = await res.arrayBuffer()
    return { ok: true, status: res.status, buffer: Buffer.from(arrayBuf) }
  }

  return { ok: res.ok, status: res.status }
}

/**
 * Saves a resume buffer securely to persistent storage.
 * Supports:
 * - Vercel Blob (when BLOB_READ_WRITE_TOKEN is set)
 * - S3-Compatible Object Storage (when S3_BUCKET & credentials are set)
 * - Private Local Filesystem (storage/resumes for local dev or persistent servers)
 */
export async function saveResumeFile(buffer: Buffer, originalFilename: string): Promise<{
  storageKey: string
  filePath: string
  fileSize: number
  provider: StorageProviderType
}> {
  const ext = getSafeExtension(originalFilename)
  if (!ext) {
    throw new Error("Invalid file extension. Only PDF, DOC, and DOCX are allowed.")
  }

  const randomId = crypto.randomBytes(12).toString("hex")
  const storageKey = `resume_${Date.now()}_${randomId}${ext}`
  const provider = getStorageProvider()

  if (provider === "vercel-blob") {
    // Vercel Blob Storage via REST
    const token = process.env.BLOB_READ_WRITE_TOKEN!
    const res = await fetch(`https://blob.vercel-storage.com/${storageKey}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "x-add-random-suffix": "0",
      },
      body: buffer as unknown as BodyInit,
    })

    if (!res.ok) {
      throw new Error(`Failed to upload resume to Vercel Blob storage: ${res.statusText}`)
    }

    const data = await res.json()
    return {
      storageKey,
      filePath: data.url || `blob:${storageKey}`,
      fileSize: buffer.length,
      provider: "vercel-blob",
    }
  }

  if (provider === "s3") {
    // S3-Compatible Storage
    const res = await s3Request("PUT", storageKey, buffer, "application/octet-stream")
    if (!res.ok) {
      throw new Error(`Failed to upload resume to S3 storage. Status: ${res.status}`)
    }
    return {
      storageKey,
      filePath: `s3://${process.env.S3_BUCKET}/${storageKey}`,
      fileSize: buffer.length,
      provider: "s3",
    }
  }

  // Default: Private Local Filesystem
  await ensureLocalStorageDir()
  const targetPath = path.join(LOCAL_STORAGE_DIR, storageKey)

  const normalizedTarget = path.normalize(targetPath)
  if (!normalizedTarget.startsWith(path.normalize(LOCAL_STORAGE_DIR))) {
    throw new Error("Invalid storage destination")
  }

  await fs.writeFile(targetPath, buffer)

  return {
    storageKey,
    filePath: path.relative(process.cwd(), targetPath),
    fileSize: buffer.length,
    provider: "local",
  }
}

/**
 * Retrieves the raw buffer of a stored resume file across local, S3, or Vercel Blob.
 */
export async function getResumeFileBuffer(storageKey: string): Promise<Buffer | null> {
  if (!storageKey || storageKey.includes("..") || storageKey.includes("/") || storageKey.includes("\\")) {
    return null
  }

  const provider = getStorageProvider()

  if (provider === "vercel-blob") {
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN!
      const res = await fetch(`https://blob.vercel-storage.com/${storageKey}`, {
        headers: { authorization: `Bearer ${token}` }
      })
      if (!res.ok) return null
      const arrayBuf = await res.arrayBuffer()
      return Buffer.from(arrayBuf)
    } catch {
      return null
    }
  }

  if (provider === "s3") {
    try {
      const res = await s3Request("GET", storageKey)
      return res.ok && res.buffer ? res.buffer : null
    } catch {
      return null
    }
  }

  // Local filesystem
  const targetPath = path.join(LOCAL_STORAGE_DIR, storageKey)
  const normalizedTarget = path.normalize(targetPath)
  if (!normalizedTarget.startsWith(path.normalize(LOCAL_STORAGE_DIR))) {
    return null
  }

  try {
    return await fs.readFile(normalizedTarget)
  } catch {
    return null
  }
}

/**
 * Resolves the local absolute path if stored locally.
 */
export async function getResumeFilePath(storageKey: string): Promise<string | null> {
  if (!storageKey || storageKey.includes("..") || storageKey.includes("/") || storageKey.includes("\\")) {
    return null
  }

  const targetPath = path.join(LOCAL_STORAGE_DIR, storageKey)
  const normalizedTarget = path.normalize(targetPath)
  if (!normalizedTarget.startsWith(path.normalize(LOCAL_STORAGE_DIR))) {
    return null
  }

  try {
    await fs.access(normalizedTarget)
    return normalizedTarget
  } catch {
    return null
  }
}

/**
 * Deletes a stored resume file from persistent storage.
 */
export async function deleteResumeFile(storageKey: string): Promise<boolean> {
  if (!storageKey || storageKey.includes("..")) return false

  const provider = getStorageProvider()

  if (provider === "vercel-blob") {
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN!
      const res = await fetch(`https://blob.vercel-storage.com/${storageKey}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  if (provider === "s3") {
    try {
      const res = await s3Request("DELETE", storageKey)
      return res.ok
    } catch {
      return false
    }
  }

  const filePath = await getResumeFilePath(storageKey)
  if (!filePath) return false

  try {
    await fs.unlink(filePath)
    return true
  } catch {
    return false
  }
}
