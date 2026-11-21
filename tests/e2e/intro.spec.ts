import { expect, test, type Page } from '@playwright/test'
import { expectNoAxeViolations } from './helpers'

/**
 * The site treats an automated browser as having already lit the intro diya
 * (src/components/diya-lit.ts), so every other test starts with it lit.
 * These tests hide that flag to go through the lighting itself.
 */
async function visitAsAPerson(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })
  })
  await page.goto('/')
  await expect(page.getByTestId('diya-lighting')).toHaveAttribute('data-lit', 'false')
  // A real visit also plays the opening fade-in; let it finish, as a page
  // mid-fade fails colour-contrast checks.
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('header, main, footer')].flatMap((el) =>
        el.getAnimations().map((animation) => animation.finished),
      ),
    ),
  )
}

function centre(box: { x: number; y: number; width: number; height: number } | null) {
  if (!box) throw new Error('element is not on screen')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('lighting the intro diya', () => {
  test('the page opens on an unlit diya, with no fireworks yet', async ({ page }) => {
    await visitAsAPerson(page)
    await expect(page.getByRole('button', { name: 'Light the diya' })).toBeVisible()
    await expect(page.getByTestId('fireworks')).toHaveCount(0)
    await expectNoAxeViolations(page)
  })

  test('dragging the fuljadi onto the wick lights it and starts the fireworks', async ({
    page,
  }) => {
    await visitAsAPerson(page)
    await page.getByRole('button', { name: 'Light the diya' }).click()
    const fuljadi = page.getByTestId('fuljadi')
    await expect(fuljadi).toBeVisible()
    await expect(page.getByText('Wave the fuljadi')).toBeVisible()
    // A plain click on the fuljadi is not enough: it has to reach the wick.
    await page.waitForTimeout(700) // the pop-in animation moves the handle
    const tip = centre(await fuljadi.boundingBox())
    await page.mouse.click(tip.x, tip.y)
    await expect(page.getByTestId('diya-lighting')).toHaveAttribute('data-lit', 'false')

    const wick = centre(await page.getByTestId('diya-wick-hit').boundingBox())
    await page.mouse.move(tip.x, tip.y)
    await page.mouse.down()
    await page.mouse.move(wick.x, wick.y, { steps: 12 })
    await page.mouse.up()

    await expect(page.getByTestId('diya-lighting')).toHaveAttribute('data-lit', 'true')
    await expect(page.getByText('The diya is lit. Welcome.')).toBeVisible()
    await expect(fuljadi).toHaveCount(0)
    await expect(page.getByTestId('fireworks')).toBeVisible()

    // Lit once, it stays lit for the tab, and the fireworks do not replay.
    await page.reload()
    await expect(page.getByTestId('diya-lighting')).toHaveAttribute('data-lit', 'true')
    await expect(page.getByTestId('fireworks')).toHaveCount(0)
  })

  test('the keyboard alone can light the diya, or put the fuljadi away', async ({ page }) => {
    await visitAsAPerson(page)
    const lightButton = page.getByRole('button', { name: 'Light the diya' })
    await lightButton.focus()
    await page.keyboard.press('Enter')

    const handle = page.getByRole('button', { name: /Fuljadi/ })
    await expect(handle).toBeFocused()
    await expect(page.getByText('Press Enter to light the diya')).toBeVisible()
    await expectNoAxeViolations(page)

    // Escape puts it away, unlocks scrolling and returns to the button.
    await page.keyboard.press('Escape')
    await expect(handle).toHaveCount(0)
    await expect(lightButton).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')

    await page.keyboard.press('Enter')
    await expect(handle).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('diya-lighting')).toHaveAttribute('data-lit', 'true')
    await expect(page.getByText('The diya is lit. Welcome.')).toBeFocused()
    await expect(page.getByTestId('fireworks')).toBeVisible()
  })

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })
    test('one press lights the diya, with no fuljadi and no fireworks', async ({ page }) => {
      await visitAsAPerson(page)
      await page.getByRole('button', { name: 'Light the diya' }).click()
      await expect(page.getByTestId('diya-lighting')).toHaveAttribute('data-lit', 'true')
      await expect(page.getByTestId('fuljadi')).toHaveCount(0)
      await expect(page.getByText('The diya is lit. Welcome.')).toBeVisible()
      await expect(page.getByTestId('fireworks')).toHaveCount(0)
    })
  })
})
