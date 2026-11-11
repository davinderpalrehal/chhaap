import { assertFails, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteObject, getBytes, listAll, ref, updateMetadata, uploadString } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

import { createTestEnv, verifiedUser } from './env.ts'

const existing = 'logos/c1/seed.png'
const fresh = 'logos/c1/new.png'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await createTestEnv()
})

beforeEach(async () => {
  await env.clearStorage()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadString(ref(ctx.storage(), existing), 'seed', 'raw', { contentType: 'image/png' })
  })
})

afterAll(async () => {
  await env.cleanup()
})

describe.each([
  ['unauthenticated', () => env.unauthenticatedContext().storage()],
  ['authenticated', () => env.authenticatedContext('uid-1', verifiedUser).storage()],
])('Storage, %s client', (_label, storage) => {
  it('cannot read an object', async () => {
    await assertFails(getBytes(ref(storage(), existing)))
  })

  it('cannot list objects', async () => {
    await assertFails(listAll(ref(storage(), 'logos/c1')))
  })

  it('cannot create an object', async () => {
    await assertFails(uploadString(ref(storage(), fresh), 'x', 'raw', { contentType: 'image/png' }))
  })

  it('cannot overwrite an object', async () => {
    await assertFails(
      uploadString(ref(storage(), existing), 'x', 'raw', { contentType: 'image/png' }),
    )
  })

  it('cannot update metadata', async () => {
    await assertFails(updateMetadata(ref(storage(), existing), { contentType: 'image/svg+xml' }))
  })

  it('cannot delete an object', async () => {
    await assertFails(deleteObject(ref(storage(), existing)))
  })
})
