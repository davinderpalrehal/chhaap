import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

// Desktop browsers only (no mobile layouts in v1). On CI the built app is served
// with `vite preview`, so run `npm run build` first; locally the dev server is used.
const port = process.env.CI ? 4173 : 5173

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: process.env.CI ? 'npm run preview' : 'npm run dev',
    port,
    reuseExistingServer: !process.env.CI,
  },
})
