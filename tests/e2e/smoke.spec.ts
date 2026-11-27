import { expect, test } from '@playwright/test'
import { signIn, trackErrors } from './helpers'

const ROUTES = ['/dashboard', '/projects', '/keys', '/projects/p-nova-ecom', '/quality', '/issues', '/team', '/terminology', '/memory', '/analytics', '/clients', '/clients/c-nova', '/integrations', '/settings']

test('every page loads without errors', async ({ page }) => {
  const errors = trackErrors(page)
  await signIn(page)
  for (const r of ROUTES) {
    await page.goto(`/#${r}`)
    await expect(page.locator('main h1').first()).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('dashboard shows reference KPIs', async ({ page }) => {
  await signIn(page)
  const kpis = page.getByRole('region', { name: 'Key metrics' })
  await expect(kpis).toContainText('24')
  await expect(kpis).toContainText('1.28M')
  await expect(kpis).toContainText('94.2%')
  await expect(kpis).toContainText('146h')
})

test('demo flow: scan Nova, accept a critical fix, score updates', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/projects/p-nova-ecom')
  await page.getByRole('button', { name: 'Run AI QA' }).click()
  await page.getByRole('button', { name: 'Start scan' }).click()
  await expect(page.getByText('Needs Review')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('dialog')).toContainText('87.4')
  await expect(page.getByRole('dialog')).toContainText('23')
  await page.getByRole('button', { name: /Review findings/ }).click()
  await page.getByRole('button', { name: 'Accept suggestion' }).click()
  await expect(page.getByText('Issue successfully resolved.')).toBeVisible()
  await page.goto('/#/projects/p-nova-ecom')
  await expect(page.getByText('89.4').first()).toBeVisible()
})

test('create project adds it to the list', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/projects')
  await page.getByRole('button', { name: 'Create project' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Create Project' }).click()
  await expect(dialog.getByText('Project name is required.')).toBeVisible()
  await dialog.getByLabel('Project Name').fill('Smoke Test Launch')
  await dialog.getByLabel('Client').selectOption({ label: 'Lumen Labs' })
  await dialog.getByRole('button', { name: 'German' }).click()
  await dialog.getByLabel('Word Count').fill('12000')
  await dialog.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByRole('heading', { name: 'Smoke Test Launch' })).toBeVisible()
  await page.goto('/#/projects')
  await expect(page.getByText('Smoke Test Launch')).toBeVisible()
})

test('glossary term can be added and persists after reload', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/terminology')
  await page.getByRole('button', { name: 'Add term' }).click()
  await page.getByLabel('Source term').fill('Loyalty tier')
  await page.getByLabel('Target term').fill('Niveau de fidélité')
  await page.getByRole('button', { name: 'Save term' }).click()
  await expect(page.getByText('Glossary term saved.')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Niveau de fidélité')).toBeVisible()
})

test('reset demo restores seeded data', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/issues?issue=QA-1001')
  await page.getByRole('button', { name: 'Mark resolved' }).click()
  await page.goto('/#/settings?tab=demo')
  await page.getByRole('button', { name: 'Reset demo data' }).click()
  await page.getByLabel(/Type/).fill('reset')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page).toHaveURL(/dashboard/)
  await expect(page.getByRole('region', { name: 'Key metrics' })).toContainText('18')
})

test('string keys: create a key, add values inline and in the drawer', async ({ page }) => {
  await signIn(page)
  await page.goto('/#/keys?project=p-aurora-help')
  await page.getByRole('button', { name: 'Add key' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Create key' }).click()
  await expect(dialog.getByText('Key is required.')).toBeVisible()
  await dialog.getByLabel('Key', { exact: true }).fill('help.reset_title')
  await dialog.getByLabel('Source text (English)').fill('Reset your device')
  await dialog.getByLabel(/German$/).fill('Gerät zurücksetzen')
  await dialog.getByRole('button', { name: 'Create key' }).click()
  await expect(page.getByText('String key created.')).toBeVisible()

  // The new key opens in the drawer: add the French value there.
  const drawer = page.getByRole('dialog')
  await drawer.getByLabel('French value for help.reset_title').fill('Réinitialiser votre appareil')
  await drawer.getByRole('button', { name: 'Save French value' }).click()
  await expect(page.getByText('Value saved.').first()).toBeVisible()
  await page.keyboard.press('Escape')

  // Add the Japanese value inline in the grid.
  await page.getByPlaceholder('Search keys or values…').fill('reset_title')
  await page.getByRole('button', { name: 'Add value' }).click()
  await page.getByLabel('Japanese value for help.reset_title').fill('デバイスをリセット')
  await page.keyboard.press('Enter')
  await expect(page.getByText('デバイスをリセット')).toBeVisible()
  await expect(page.getByText('3/3 languages')).toBeVisible()

  await page.reload()
  await page.getByPlaceholder('Search keys or values…').fill('reset_title')
  await expect(page.getByText('Réinitialiser votre appareil')).toBeVisible()
})
