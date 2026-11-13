import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Fail on serious or critical WCAG A/AA violations; minor and moderate ones are reported only.
const BLOCKING = new Set(['serious', 'critical'])

for (const path of ['/sign-in', '/']) {
  test(`${path} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('main')).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const blocking = results.violations
      .filter((v) => BLOCKING.has(v.impact ?? ''))
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
    expect(blocking).toEqual([])
  })
}
