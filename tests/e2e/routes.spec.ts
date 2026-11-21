import { expect, test } from '@playwright/test'
import {
  LANGS,
  expectNoAxeViolations,
  expectNoHorizontalOverflow,
  trackExternalRequests,
  useLanguage,
} from './helpers'

/** The diya page, and an address that does not exist (the not-found page). */
const ROUTES = ['/', '/no-such-page']

for (const lang of LANGS) {
  test.describe(`every route in ${lang}`, () => {
    for (const route of ROUTES) {
      test(route, async ({ page, baseURL }) => {
        const external = trackExternalRequests(page, baseURL!)
        await useLanguage(page, lang)
        await page.goto(route)
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', lang)
        await page.waitForLoadState('networkidle')
        await expectNoHorizontalOverflow(page)
        await expectNoAxeViolations(page)
        expect(external).toEqual([])
      })
    }
  })
}

test('the not-found page leads back to the diya', async ({ page }) => {
  await page.goto('/bhulkao')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
  await page.getByRole('link', { name: 'Go to the home page' }).click()
  await expect(page.getByTestId('diya-lighting')).toBeVisible()
})
