// Seeds the one owner (AD-8): `npm run owner:bootstrap -- --email you@example.com`.
// Runs against the Firestore emulator when FIRESTORE_EMULATOR_HOST is set;
// otherwise an explicit `--project` is required (Application Default Credentials).
import process from 'node:process'
import { parseArgs } from 'node:util'

import { deleteApp, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

import { bootstrapOwner, OwnerExistsError } from '../src/bootstrap-owner.ts'

const USAGE = 'Usage: npm run owner:bootstrap -- --email <email> [--project <project-id>]'

function fail(message: string, code = 1): never {
  console.error(message)
  process.exit(code)
}

let values: { email?: string; project?: string }
try {
  ;({ values } = parseArgs({ options: { email: { type: 'string' }, project: { type: 'string' } } }))
} catch (error) {
  fail(`${(error as Error).message}\n${USAGE}`, 2)
}

if (!values.email) fail(`--email is required.\n${USAGE}`, 2)

const emulator = process.env.FIRESTORE_EMULATOR_HOST
if (!emulator && !values.project) {
  fail(`Set FIRESTORE_EMULATOR_HOST to use the emulator, or pass --project explicitly.\n${USAGE}`, 2)
}
const projectId = values.project ?? process.env.GCLOUD_PROJECT ?? 'demo-chhaap'

const app = initializeApp({ projectId })
try {
  const email = await bootstrapOwner(getFirestore(app), values.email)
  console.log(`Owner set: allowlist/${email} in ${projectId}${emulator ? ` (emulator ${emulator})` : ''}.`)
} catch (error) {
  process.exitCode = 1
  if (error instanceof OwnerExistsError) {
    console.error(error.message)
  } else if (error instanceof Error && error.name === 'ZodError') {
    const issues = (error as Error & { issues: { message: string }[] }).issues
    console.error(`Invalid --email: ${issues.map((issue) => issue.message).join('; ')}. Nothing was written.`)
  } else {
    console.error(error)
  }
} finally {
  // Let the SDK finish (e.g. roll back a refused transaction) before exiting.
  await deleteApp(app)
}
