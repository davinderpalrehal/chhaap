import type { Firestore } from 'firebase-admin/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { assertOwner, assertTeamMember } from './auth.js'
import { clearFirestore, emulatorDb } from './emulator.js'

type Auth = Parameters<typeof assertTeamMember>[0]

const authFor = (token: Record<string, unknown>): Auth =>
  ({ uid: 'uid-1', rawToken: '', token }) as unknown as Auth

const member = authFor({ email: 'member@example.com', email_verified: true })
const owner = authFor({ email: 'owner@example.com', email_verified: true })

let db: Firestore
let close: () => Promise<void>

beforeAll(() => {
  ;({ db, close } = emulatorDb('auth-test'))
})

beforeEach(async () => {
  await clearFirestore()
  await db.doc('allowlist/member@example.com').set({ role: 'member' })
  await db.doc('allowlist/owner@example.com').set({ role: 'owner' })
})

afterAll(async () => {
  await close?.()
})

const denied = { code: 'permission-denied' }

describe('assertTeamMember', () => {
  it('returns the email and role of a listed, verified caller', async () => {
    await expect(assertTeamMember(member, db)).resolves.toEqual({ email: 'member@example.com', role: 'member' })
    await expect(assertTeamMember(owner, db)).resolves.toEqual({ email: 'owner@example.com', role: 'owner' })
  })

  it('matches a mixed-case token email to the lowercased key', async () => {
    const mixed = authFor({ email: 'Member@Example.COM', email_verified: true })
    await expect(assertTeamMember(mixed, db)).resolves.toEqual({ email: 'member@example.com', role: 'member' })
  })

  it('denies a call with no auth', async () => {
    await expect(assertTeamMember(undefined, db)).rejects.toMatchObject(denied)
  })

  it('denies an unverified email, even when listed', async () => {
    const unverified = authFor({ email: 'member@example.com', email_verified: false })
    await expect(assertTeamMember(unverified, db)).rejects.toMatchObject(denied)
  })

  it('denies a token without an email', async () => {
    await expect(assertTeamMember(authFor({ email_verified: true }), db)).rejects.toMatchObject(denied)
  })

  it('denies an email that is not listed', async () => {
    const outsider = authFor({ email: 'outsider@example.com', email_verified: true })
    await expect(assertTeamMember(outsider, db)).rejects.toMatchObject(denied)
  })

  it('a removal takes effect on the next call', async () => {
    await expect(assertTeamMember(member, db)).resolves.toMatchObject({ role: 'member' })
    await db.doc('allowlist/member@example.com').delete()
    await expect(assertTeamMember(member, db)).rejects.toMatchObject(denied)
  })
})

describe('assertOwner', () => {
  it('returns the owner', async () => {
    await expect(assertOwner(owner, db)).resolves.toEqual({ email: 'owner@example.com', role: 'owner' })
  })

  it('denies a member', async () => {
    await expect(assertOwner(member, db)).rejects.toMatchObject(denied)
  })

  it('denies a call with no auth or an outsider', async () => {
    await expect(assertOwner(undefined, db)).rejects.toMatchObject(denied)
    const outsider = authFor({ email: 'outsider@example.com', email_verified: true })
    await expect(assertOwner(outsider, db)).rejects.toMatchObject(denied)
  })

  it('a demotion takes effect on the next call', async () => {
    await db.doc('allowlist/owner@example.com').set({ role: 'member' })
    await expect(assertOwner(owner, db)).rejects.toMatchObject(denied)
  })
})
