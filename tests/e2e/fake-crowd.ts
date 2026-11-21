import type { Page } from '@playwright/test'

/**
 * A stand-in for the two Firestore REST calls the site makes for the shared
 * count of lit diyas (src/crowd/crowd.ts). It answers every request to
 * firestore.googleapis.com from memory, so nothing leaves the test. It does
 * not apply the security rules.
 */
export interface FakeCrowd {
  /** Diyas lit by "other people". Change it during a test to move the count. */
  others: number
  /** Ids of the devices this page has registered. */
  devices: Set<string>
  /** Every request received, as "METHOD path". */
  requests: string[]
  /** While true, every request fails, as when the service is busy. */
  failing: boolean
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }

export async function fakeCrowd(page: Page, others: number): Promise<FakeCrowd> {
  const state: FakeCrowd = { others, devices: new Set(), requests: [], failing: false }
  await page.route('https://firestore.googleapis.com/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    state.requests.push(`${request.method()} ${url.pathname}`)
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, headers: CORS, contentType: 'application/json', json: body })
    if (state.failing) return json(503, { error: { status: 'UNAVAILABLE' } })

    if (url.pathname.endsWith('/diyaRounds/annakut-2026:runAggregationQuery')) {
      const query = request.postDataJSON() as {
        structuredAggregationQuery: { aggregations: { count: { upTo: string } }[] }
      }
      const upTo = Number(query.structuredAggregationQuery.aggregations[0]?.count.upTo)
      const total = Math.min(upTo, state.others + state.devices.size)
      return json(200, [
        { result: { aggregateFields: { total: { integerValue: String(total) } } } },
      ])
    }
    if (url.pathname.endsWith('/diyaRounds/annakut-2026/lights')) {
      const id = url.searchParams.get('documentId') ?? ''
      if (!/^[a-z0-9]{20}$/.test(id)) return json(400, { error: { status: 'INVALID_ARGUMENT' } })
      if (state.devices.has(id)) return json(409, { error: { status: 'ALREADY_EXISTS' } })
      state.devices.add(id)
      return json(200, { name: `${url.pathname}/${id}`, fields: {} })
    }
    return json(404, { error: { status: 'NOT_FOUND' } })
  })
  return state
}
