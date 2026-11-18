import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { signInWithGoogle } from './emulators.ts'

// Fail on serious or critical WCAG A/AA violations; minor and moderate ones are reported only.
const BLOCKING = new Set(['serious', 'critical'])

async function blockingViolations(page: Page) {
  await expect(page.getByRole('main')).toBeVisible()
  const results = await new AxeBuilder({ page })
    // The Vue DevTools overlay exists only on the dev server, not in the app.
    .exclude('#__vue-devtools-container__')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return results.violations
    .filter((v) => BLOCKING.has(v.impact ?? ''))
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

test('/sign-in has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/sign-in')
  expect(await blockingViolations(page)).toEqual([])
})

const signedInScreens = [
  { path: '/', email: 'Member@Example.com' },
  { path: '/not-authorised', email: 'outsider@example.com' },
]

for (const { path, email } of signedInScreens) {
  test(`${path} has no serious or critical accessibility violations`, async ({ page }) => {
    await signInWithGoogle(page, email)
    await expect(page).toHaveURL(path)
    expect(await blockingViolations(page)).toEqual([])
  })
}
