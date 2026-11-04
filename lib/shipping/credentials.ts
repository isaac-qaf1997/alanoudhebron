import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'

function encryptionKey() {
  const raw = process.env.SHIPPING_CREDENTIALS_ENCRYPTION_KEY
  if (!raw) throw new Error('Missing SHIPPING_CREDENTIALS_ENCRYPTION_KEY')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error('SHIPPING_CREDENTIALS_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  }
  return key
}

export function encryptShippingSecret(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptShippingSecret(value: string | null | undefined) {
  if (!value) return null
  const [version, ivText, tagText, bodyText] = value.split(':')
  if (version !== 'v1' || !ivText || !tagText || !bodyText) throw new Error('Invalid encrypted shipping credential')
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivText, 'base64'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(bodyText, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

export function safeSecretEqual(candidate: string, expected: string) {
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function verifyShippingSettingsPassword(candidate: string) {
  const expected = process.env.SHIPPING_SETTINGS_PASSWORD
  if (!expected) throw new Error('Missing SHIPPING_SETTINGS_PASSWORD')
  return safeSecretEqual(candidate, expected)
}
