import { assertFails, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

import { createTestEnv, verifiedUser } from './env.ts'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await createTestEnv()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'codes/abc23'), { name: 'seed' })
    await setDoc(doc(ctx.firestore(), 'allowlist/member@example.com'), { role: 'member' })
  })
})

afterAll(async () => {
  await env?.cleanup()
})

const paths = ['codes/abc23', 'allowlist/member@example.com', 'clients/c1']

describe.each([
  ['unauthenticated', () => env.unauthenticatedContext().firestore()],
  ['authenticated', () => env.authenticatedContext('uid-1', verifiedUser).firestore()],
])('Firestore, %s client', (_label, db) => {
  it.each(paths)('cannot read %s', async (path) => {
    await assertFails(getDoc(doc(db(), path)))
  })

  it('cannot list a collection', async () => {
    await assertFails(getDocs(collection(db(), 'codes')))
  })

  it.each(paths)('cannot create or overwrite %s', async (path) => {
    await assertFails(setDoc(doc(db(), path), { x: 1 }))
  })

  it('cannot update an existing document', async () => {
    await assertFails(updateDoc(doc(db(), 'codes/abc23'), { name: 'changed' }))
  })

  it('cannot delete an existing document', async () => {
    await assertFails(deleteDoc(doc(db(), 'codes/abc23')))
  })
})
