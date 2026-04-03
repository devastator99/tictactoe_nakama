export function parseJsonPayload<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === 'object') {
    return payload as T
  }

  if (typeof payload !== 'string' || payload.trim().length === 0) {
    return fallback
  }

  try {
    return JSON.parse(payload) as T
  } catch {
    return fallback
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export function buildDisplayUsername(userId?: string | null, username?: string | null): string {
  if (username && username.trim().length > 0) {
    return username.trim()
  }

  const suffix = (userId || '0000').slice(0, 4)
  return `Player${suffix}`
}

export function getOrCreateDeviceId(): string {
  const storageKey = 'lila.deviceId'
  const existingDeviceId = window.localStorage.getItem(storageKey)
  if (existingDeviceId) {
    return existingDeviceId
  }

  const newDeviceId = crypto.randomUUID()
  window.localStorage.setItem(storageKey, newDeviceId)
  return newDeviceId
}

export function buildMatchmakerQuery(mode: string): string {
  return `+properties.mode:${mode}`
}
