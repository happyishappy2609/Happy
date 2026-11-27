import type { StateStorage } from 'zustand/middleware'

/**
 * localStorage wrapper that never throws (private mode, blocked storage, sandboxed iframes).
 * Falls back to in-memory storage so the demo keeps working for the session.
 */
const memory = new Map<string, string>()

function available() {
  try {
    const k = '__lp_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

const hasLocal = typeof window !== 'undefined' && available()

export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return hasLocal ? window.localStorage.getItem(name) : (memory.get(name) ?? null)
    } catch {
      return memory.get(name) ?? null
    }
  },
  setItem: (name, value) => {
    try {
      if (hasLocal) window.localStorage.setItem(name, value)
      else memory.set(name, value)
    } catch {
      memory.set(name, value)
    }
  },
  removeItem: (name) => {
    try {
      if (hasLocal) window.localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
    memory.delete(name)
  },
}

export const storageIsPersistent = hasLocal
