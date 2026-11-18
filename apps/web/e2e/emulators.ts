import process from 'node:process'

import { expect, type Page } from '@playwright/test'

// Set by `firebase emulators:exec` (root `npm run test:e2e`).
const PROJECT = 'demo-chhaap'

function host(name: 'FIRESTORE_EMULATOR_HOST' | 'FIREBASE_AUTH_EMULATOR_HOST'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set: run e2e through the root \`npm run test:e2e\`.`)
  return value
}

/** The emulator origins the app may call (firebase.json ports), as `host:port`. */
export const EMULATOR_HOSTS = ['127.0.0.1:9099', '127.0.0.1:8080', 'localhost:9099', 'localhost:8080']

async function call(url: string, init: RequestInit): Promise<void> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${init.method} ${url} failed: ${res.status} ${await res.text()}`)
}

/** Deletes every Auth account and Firestore document in the emulators. */
export async function clearEmulators(): Promise<void> {
  await call(`http://${host('FIREBASE_AUTH_EMULATOR_HOST')}/emulator/v1/projects/${PROJECT}/accounts`, {
    method: 'DELETE',
  })
  await call(
    `http://${host('FIRESTORE_EMULATOR_HOST')}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
}

/** Writes `allowlist/{email} { role }`, bypassing rules (the emulator's `owner` token). */
export async function seedAllowlist(email: string, role: 'owner' | 'member'): Promise<void> {
  const base = `http://${host('FIRESTORE_EMULATOR_HOST')}/v1/projects/${PROJECT}/databases/(default)/documents`
  await call(`${base}/allowlist/${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { role: { stringValue: role } } }),
  })
}

/**
 * Creates a Google account in the Auth emulator with a fixed id, so every test
 * signs in to the same account instead of racing to create it.
 */
export async function seedGoogleAccount(email: string): Promise<void> {
  const idToken = JSON.stringify({ sub: `google-${email.toLowerCase()}`, email, email_verified: true })
  await call(
    `http://${host('FIREBASE_AUTH_EMULATOR_HOST')}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestUri: 'http://localhost',
        postBody: `providerId=google.com&id_token=${encodeURIComponent(idToken)}`,
        returnSecureToken: true,
      }),
    },
  )
}

/**
 * Signs in through the Auth emulator's Google popup, picking the seeded account
 * for `email`, and waits until the app has left the sign-in screen.
 *
 * Retried: the emulator's helper iframe loads gapi from apis.google.com, and when
 * that load fails the popup's result never reaches the app.
 */
export async function signInWithGoogle(page: Page, email: string): Promise<void> {
  await expect(async () => {
    await page.goto('/sign-in')
    await expect(page.getByRole('main')).toBeVisible()
    if (new URL(page.url()).pathname !== '/sign-in') return // a previous attempt landed late
    const popupPromise = page.waitForEvent('popup')
    await page.getByRole('button', { name: 'Sign in with Google' }).click()
    const popup = await popupPromise
    // The widget wires its click handlers in an inline script after a render-blocking
    // CDN script, so the account row can be visible before it is clickable. Wait for
    // the handler page itself (not the popup's first about:blank) to finish loading.
    await popup.waitForURL(/\/emulator\/auth\/handler/, { waitUntil: 'load' })
    await popup.locator('.js-reuse-account', { hasText: email }).click()
    // The first allowlist read can be slow on a cold Firestore emulator.
    await page.waitForURL((url) => url.pathname !== '/sign-in', { timeout: 15_000 })
  }).toPass({ timeout: 50_000 })
}
