import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'

const root = fileURLToPath(new URL('../../', import.meta.url))

// Emulator hosts come from FIRESTORE_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST,
// which `firebase emulators:exec` sets. The `demo-` project id can never reach production.
export function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'demo-chhaap',
    firestore: { rules: readFileSync(`${root}firestore.rules`, 'utf8') },
    storage: { rules: readFileSync(`${root}storage.rules`, 'utf8') },
  })
}

export const verifiedUser = { email: 'member@example.com', email_verified: true }
