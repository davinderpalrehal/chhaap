// Helpers for `*.emulator.test.ts`, which run under `npm run test:rules`
// (`firebase emulators:exec` sets FIRESTORE_EMULATOR_HOST).
import process from 'node:process'

import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

const PROJECT_ID = 'demo-chhaap'

export function emulatorDb(name: string): { app: App; db: Firestore; close: () => Promise<void> } {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST is not set; run through `npm run test:rules`.')
  }
  const app = initializeApp({ projectId: PROJECT_ID }, name)
  return { app, db: getFirestore(app), close: () => deleteApp(app) }
}

export async function clearFirestore(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST
  const res = await fetch(
    `http://${host}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
  if (!res.ok) throw new Error(`Clearing the Firestore emulator failed: ${res.status} ${await res.text()}`)
}
