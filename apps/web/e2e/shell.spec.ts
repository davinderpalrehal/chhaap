import { expect, test } from '@playwright/test'

test('sign-in screen offers Google sign-in, disabled until Story 1.2', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.getByRole('heading', { level: 1, name: 'Chhaap' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeDisabled()
})

test('home renders inside the app layout', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner')).toContainText('Chhaap')
  await expect(page.getByRole('main').getByRole('heading', { name: 'Home' })).toBeVisible()
})
