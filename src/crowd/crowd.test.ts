import { describe, expect, it, vi } from 'vitest'
import { crowdConfig, firestoreCrowd, newDeviceId, simulatedCrowd, siteCrowd } from './crowd'

const config = { apiKey: 'test-key', projectId: 'test-project' }
const PARENT =
  'https://firestore.googleapis.com/v1/projects/test-project/databases/(default)/documents/diyaRounds/round-1'

function answering(status: number, body: unknown = {}) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
}

describe('crowdConfig', () => {
  it('reads the short names, then the VITE_FIREBASE_ names', () => {
    expect(crowdConfig({ API_KEY: ' k ', PROJECT_ID: 'p' })).toEqual({
      apiKey: 'k',
      projectId: 'p',
    })
    expect(crowdConfig({ VITE_FIREBASE_API_KEY: 'k', VITE_FIREBASE_PROJECT_ID: 'p' })).toEqual({
      apiKey: 'k',
      projectId: 'p',
    })
  })
  it('is null unless both settings are present', () => {
    expect(crowdConfig({})).toBeNull()
    expect(crowdConfig({ API_KEY: 'k' })).toBeNull()
    expect(crowdConfig({ API_KEY: '', PROJECT_ID: 'p' })).toBeNull()
  })
})

describe('newDeviceId', () => {
  it('is 20 lower-case letters and digits, and different each time', () => {
    const ids = Array.from({ length: 50 }, newDeviceId)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]{20}$/)
    expect(new Set(ids).size).toBe(50)
  })
})

describe('firestoreCrowd', () => {
  it('registers a device by creating its empty document', async () => {
    const fetchFn = answering(200)
    await firestoreCrowd(config, 'round-1', fetchFn).register('abcdefghij0123456789')
    const [url, init] = fetchFn.mock.calls[0]!
    expect(url).toBe(`${PARENT}/lights?documentId=abcdefghij0123456789`)
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'X-Goog-Api-Key': 'test-key' })
    expect(JSON.parse(String(init?.body))).toEqual({ fields: {} })
  })

  it('treats "already exists" as counted, and other failures as errors', async () => {
    const id = 'abcdefghij0123456789'
    await expect(firestoreCrowd(config, 'round-1', answering(409)).register(id)).resolves.toBe(
      undefined,
    )
    await expect(firestoreCrowd(config, 'round-1', answering(403)).register(id)).rejects.toThrow()
    await expect(firestoreCrowd(config, 'round-1', answering(500)).register(id)).rejects.toThrow()
  })

  it('counts the devices, no further than asked', async () => {
    const fetchFn = answering(200, [
      { result: { aggregateFields: { total: { integerValue: '37' } } }, readTime: 'now' },
    ])
    expect(await firestoreCrowd(config, 'round-1', fetchFn).count(100)).toBe(37)
    const [url, init] = fetchFn.mock.calls[0]!
    expect(url).toBe(`${PARENT}:runAggregationQuery`)
    expect(JSON.parse(String(init?.body))).toEqual({
      structuredAggregationQuery: {
        structuredQuery: { from: [{ collectionId: 'lights' }] },
        aggregations: [{ alias: 'total', count: { upTo: '100' } }],
      },
    })
  })

  it('rejects an answer without a count, and a failed request', async () => {
    await expect(
      firestoreCrowd(config, 'round-1', answering(200, [{}])).count(100),
    ).rejects.toThrow()
    await expect(firestoreCrowd(config, 'round-1', answering(429)).count(100)).rejects.toThrow()
  })
})

describe('simulatedCrowd', () => {
  it('starts when this device lights its diya and climbs to the goal', async () => {
    let now = 0
    const crowd = simulatedCrowd(() => now)
    expect(await crowd.count(100)).toBe(0)
    await crowd.register('x')
    expect(await crowd.count(100)).toBe(12)
    now = 5000
    expect(await crowd.count(100)).toBe(42)
    now = 60000
    expect(await crowd.count(100)).toBe(100)
  })
})

describe('siteCrowd', () => {
  it('has no count in a production build without Firebase settings', () => {
    expect(siteCrowd({ DEV: false })).toBeNull()
    expect(siteCrowd({ DEV: true })).not.toBeNull()
    expect(siteCrowd({ DEV: false, API_KEY: 'k', PROJECT_ID: 'p' })).not.toBeNull()
  })
})
