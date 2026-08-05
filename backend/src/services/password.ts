// 密码哈希（对应 tasks.md T008）：node:crypto scrypt + 随机盐，不存明文密码
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const SALT_BYTES = 16
const KEY_LEN = 64

export interface PasswordRecord {
  hash: string
  salt: string
}

export async function hashPassword(password: string, existingSalt?: string): Promise<PasswordRecord> {
  const salt = existingSalt ?? randomBytes(SALT_BYTES).toString('hex')
  const derived = (await scrypt(password, salt, KEY_LEN)) as Buffer
  return { hash: derived.toString('hex'), salt }
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const derived = (await scrypt(password, salt, KEY_LEN)) as Buffer
  const expected = Buffer.from(expectedHash, 'hex')
  return expected.length === derived.length && timingSafeEqual(derived, expected)
}
