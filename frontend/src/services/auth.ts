// 本地账号：注册/登录/登出，Web Crypto 加盐 SHA-256 哈希（对应 data-model.md）
import type { Account } from '../types/models'
import { KEYS, readStorage, writeStorage, removeStorage } from './storage'

const SALT_BYTES = 16

async function generateSalt(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`)
}

export function getAccount(): Account | null {
  return readStorage<Account | null>(KEYS.account, null)
}

export function isLoggedIn(): boolean {
  return readStorage<boolean>(KEYS.loggedIn, false) && getAccount() !== null
}

/** 单用户本地：本机只允许注册一个账号 */
export async function register(username: string, password: string): Promise<Account> {
  if (getAccount()) {
    throw new Error('本机已注册账号，请直接登录')
  }
  const salt = await generateSalt()
  const passwordHash = await hashPassword(password, salt)
  const account: Account = {
    username,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  }
  writeStorage(KEYS.account, account)
  writeStorage(KEYS.loggedIn, true)
  return account
}

export async function login(username: string, password: string): Promise<Account> {
  const account = getAccount()
  if (!account || account.username !== username) {
    throw new Error('用户名或密码错误')
  }
  const passwordHash = await hashPassword(password, account.salt)
  if (passwordHash !== account.passwordHash) {
    throw new Error('用户名或密码错误')
  }
  writeStorage(KEYS.loggedIn, true)
  return account
}

export function logout(): void {
  removeStorage(KEYS.loggedIn)
}
