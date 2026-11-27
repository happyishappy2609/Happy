import type { Page } from '@playwright/test'

export async function signIn(page: Page) {
  await page.goto('/#/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /^Sign in/ }).click()
  await page.waitForURL(/#\/dashboard/)
}

export function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}
