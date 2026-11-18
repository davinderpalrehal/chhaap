import { expect, test } from '@playwright/test'

import { signInWithGoogle } from './emulators.ts'

// global-setup.ts seeds the allowlist (member@example.com, owner@example.com) and the
// Google accounts Member@Example.com (mixed case on purpose) and outsider@example.com.

test('an allowlisted member reaches home, even with a mixed-case email', async ({ page }) => {
  await signInWithGoogle(page, 'Member@Example.com')
  await expect(page).toHaveURL('/')
  const banner = page.getByRole('banner')
  await expect(banner).toContainText(/member@example\.com/i)
  await expect(banner.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await expect(page.getByRole('main').getByRole('heading', { name: 'Home' })).toBeVisible()

  // A reload goes straight back to home, and the sign-in screen redirects there.
  await page.reload()
  await expect(page.getByRole('main').getByRole('heading', { name: 'Home' })).toBeVisible()
  await page.goto('/sign-in')
  await expect(page).toHaveURL('/')
})

test('an email that is not allowlisted sees not authorised on every route', async ({ page }) => {
  await signInWithGoogle(page, 'outsider@example.com')
  await expect(page).toHaveURL('/not-authorised')
  await expect(page.getByRole('heading', { level: 1, name: 'Not authorised' })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('outsider@example.com')
  for (const path of ['/', '/sign-in', '/anything']) {
    await page.goto(path)
    await expect(page).toHaveURL('/not-authorised')
  }
})

test('signing out returns a member to sign-in', async ({ page }) => {
  await signInWithGoogle(page, 'Member@Example.com')
  await page.getByRole('banner').getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/sign-in')
  await page.goto('/')
  await expect(page).toHaveURL('/sign-in')
})

test('signing out from not authorised returns to sign-in', async ({ page }) => {
  await signInWithGoogle(page, 'outsider@example.com')
  await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/sign-in')
})

test('closing the popup stays on sign-in with a short error line', async ({ page }) => {
  await page.goto('/sign-in')
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Sign in with Google' }).click()
  const popup = await popupPromise
  await popup.close()
  // Firebase polls for a closed popup, so the error can take several seconds.
  await expect(page.getByRole('alert')).toHaveText('Sign-in did not complete. Please try again.', {
    timeout: 15_000,
  })
  await expect(page).toHaveURL('/sign-in')
})
