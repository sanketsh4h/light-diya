import { DIYA_ROUND, STORAGE_KEYS } from '../config/site'
import { readStored, writeStored } from '../i18n/storage'

/**
 * The shared count: how many different devices have lit their diya. It lives
 * in Firestore, one empty document per device, named by a random id the
 * device keeps:
 *
 *   diyaRounds/<round>/lights/<device id>
 *
 * The site talks to Firestore's REST API directly, so no Firebase code is
 * loaded. The matching security rules are in the README.
 */
export interface Crowd {
  /** Count this device as having lit its diya. Safe to call again. */
  register(device: string): Promise<void>
  /** How many devices have lit a diya, counted no further than `upTo`. */
  count(upTo: number): Promise<number>
}

export interface CrowdConfig {
  apiKey: string
  projectId: string
}

function setting(env: Record<string, unknown>, ...names: string[]): string | null {
  for (const name of names) {
    const value = env[name]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

/**
 * Firebase web settings from the build's environment: the short names used on
 * GitHub Actions and Vercel (API_KEY, PROJECT_ID), or the VITE_FIREBASE_* names.
 */
export function crowdConfig(env: Record<string, unknown>): CrowdConfig | null {
  const apiKey = setting(env, 'API_KEY', 'VITE_FIREBASE_API_KEY')
  const projectId = setting(env, 'PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID')
  return apiKey && projectId ? { apiKey, projectId } : null
}

const DEVICE_ID = /^[a-z0-9]{20}$/
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** A random 20-character id. It says nothing about the device or its owner. */
export function newDeviceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  return Array.from(bytes, (byte) => ID_CHARS[byte % ID_CHARS.length]).join('')
}

let unsavedId: string | null = null

/**
 * This device's id, made on first use and kept in localStorage so that the
 * same device is counted once however often it lights the diya. If storage is
 * unavailable, the id lasts until the page is closed.
 */
export function deviceId(): string {
  const stored = readStored(STORAGE_KEYS.device)
  if (stored && DEVICE_ID.test(stored)) return stored
  unsavedId ??= newDeviceId()
  writeStored(STORAGE_KEYS.device, unsavedId)
  return unsavedId
}

/** The count kept in Firestore, reached through its REST API. */
export function firestoreCrowd(
  config: CrowdConfig,
  round: string = DIYA_ROUND,
  fetchFn: typeof fetch = (...args) => fetch(...args),
): Crowd {
  const parent =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
    `/databases/(default)/documents/diyaRounds/${encodeURIComponent(round)}`
  const post = (url: string, body: unknown) =>
    fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': config.apiKey },
      body: JSON.stringify(body),
    })
  return {
    async register(device) {
      const response = await post(`${parent}/lights?documentId=${encodeURIComponent(device)}`, {
        fields: {},
      })
      // 409: the document is already there, so this device is already counted.
      if (!response.ok && response.status !== 409) {
        throw new Error(`Could not count this diya (${response.status})`)
      }
    },
    async count(upTo) {
      const response = await post(`${parent}:runAggregationQuery`, {
        structuredAggregationQuery: {
          structuredQuery: { from: [{ collectionId: 'lights' }] },
          aggregations: [{ alias: 'total', count: { upTo: String(upTo) } }],
        },
      })
      if (!response.ok) throw new Error(`Could not read the count (${response.status})`)
      const rows = (await response.json()) as {
        result?: { aggregateFields?: { total?: { integerValue?: string } } }
      }[]
      const value = rows.find((row) => row.result)?.result?.aggregateFields?.total?.integerValue
      const total = Number(value)
      if (value === undefined || !Number.isInteger(total) || total < 0) {
        throw new Error('The count was not a number')
      }
      return Math.min(total, upTo)
    },
  }
}

/**
 * A stand-in for the dev server when no Firebase settings are present: once
 * this device has lit its diya, "other people" light theirs over a few seconds.
 */
export function simulatedCrowd(now: () => number = Date.now): Crowd {
  let startedAt: number | null = null
  return {
    async register() {
      startedAt ??= now()
    },
    async count(upTo) {
      if (startedAt === null) return 0
      return Math.min(upTo, 12 + Math.floor(((now() - startedAt) / 1000) * 6))
    },
  }
}

/**
 * The count this build uses. A production build without Firebase settings has
 * none: lighting the diya then shows the welcome at once, with no waiting bar.
 */
export function siteCrowd(env: Record<string, unknown> & { DEV?: boolean }): Crowd | null {
  const config = crowdConfig(env)
  if (config) return firestoreCrowd(config)
  return env.DEV ? simulatedCrowd() : null
}
