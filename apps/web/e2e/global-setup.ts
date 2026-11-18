import { clearEmulators, seedAllowlist, seedGoogleAccount } from './emulators.ts'

// Fresh emulator state for every run: one owner and one member on the allowlist,
// and a Google account for each email the specs sign in with.
export default async function globalSetup(): Promise<void> {
  await clearEmulators()
  await seedAllowlist('owner@example.com', 'owner')
  await seedAllowlist('member@example.com', 'member')
  for (const email of ['Member@Example.com', 'outsider@example.com']) await seedGoogleAccount(email)
}
