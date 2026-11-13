import { expect, test } from '@playwright/test'

test('sign-in screen offers Google sign-in, disabled until Story 1.2', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.getByRole('heading', { level: 1, name: 'Chhaap' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeDisabled()
})

test('home renders inside the app bar and main', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner')).toContainText('Chhaap')
  await expect(page.getByRole('main').getByRole('heading', { name: 'Home' })).toBeVisible()
})

test('loads nothing from outside the app origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const external: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http') && url.origin !== origin) external.push(request.url())
  })
  await page.goto('/sign-in')
  await page.goto('/')
  await expect(page.getByRole('main').getByRole('heading', { name: 'Home' })).toBeVisible()
  expect(external).toEqual([])
})

test('app styles win over Vuetify through the layer order', async ({ page }) => {
  await page.goto('/sign-in')
  const button = page.getByRole('button', { name: 'Sign in with Google' })
  // Vuetify's VBtn sets a 4px radius and a Roboto font stack; tokens.css sets 0.5rem and system-ui.
  await expect(button).toHaveCSS('border-radius', '8px')
  await expect(button).toHaveCSS('font-family', /^system-ui/)
})
