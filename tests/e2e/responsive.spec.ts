import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test('no horizontal overflow and drawer navigation on mobile', async ({ page }) => {
  await signIn(page)
  for (const r of ['/dashboard', '/projects', '/quality', '/issues', '/analytics', '/settings']) {
    await page.goto(`/#${r}`)
    await page.waitForTimeout(400)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, r).toBeLessThanOrEqual(0)
  }
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('link', { name: 'Terminology' }).click()
  await expect(page.getByRole('heading', { name: 'Terminology' })).toBeVisible()
})
