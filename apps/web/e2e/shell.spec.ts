import { expect, test } from '@playwright/test'

import { EMULATOR_HOSTS } from './emulators.ts'

test('sign-in screen offers only the Google button, enabled', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.getByRole('heading', { level: 1, name: 'Chhaap' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeEnabled()
  await expect(page.getByRole('button')).toHaveCount(1)
})

test('signed out, every route leads to sign-in', async ({ page }) => {
  for (const path of ['/', '/not-authorised', '/anything']) {
    await page.goto(path)
    await expect(page).toHaveURL('/sign-in')
  }
})

// Firebase Auth's popup flow loads Google's iframe helper (gapi) from this host;
// WebKit loads it as soon as Auth starts, other browsers on the first popup.
const AUTH_POPUP_HOSTS = ['apis.google.com']

test('loads nothing from outside the app origin but the emulators and Auth', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const allowed = [...EMULATOR_HOSTS, ...AUTH_POPUP_HOSTS]
  const external: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!url.protocol.startsWith('http') || url.origin === origin) return
    if (!allowed.includes(url.host)) external.push(request.url())
  })
  await page.goto('/sign-in')
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  expect(external).toEqual([])
})

test('app styles win over Vuetify through the layer order', async ({ page }) => {
  await page.goto('/sign-in')
  const button = page.getByRole('button', { name: 'Sign in with Google' })
  // Vuetify's VBtn sets a 4px radius and a Roboto font stack; tokens.css sets 0.5rem and system-ui.
  await expect(button).toHaveCSS('border-radius', '8px')
  await expect(button).toHaveCSS('font-family', /^system-ui/)
})

test('the focused sign-in button shows the focus outline', async ({ page }) => {
  await page.goto('/sign-in')
  const button = page.getByRole('button', { name: 'Sign in with Google' })
  await expect(button).toBeVisible()
  // Vuetify's `.v-btn { outline: none }` loses to base.css's `app` layer.
  // Focused without a pointer, so `:focus-visible` applies (WebKit's Tab skips buttons).
  await button.focus()
  await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-style', 'solid')
  await expect(button).toHaveCSS('outline-width', '2px')
  await expect(button).toHaveCSS('outline-color', 'rgb(31, 79, 209)')
})
