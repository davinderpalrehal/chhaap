import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

import { createTestEnv, verifiedOwner, verifiedUser } from './env.ts'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await createTestEnv()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'codes/abc23'), { name: 'seed' })
    await setDoc(doc(ctx.firestore(), 'clients/c1'), { name: 'seed' })
    await setDoc(doc(ctx.firestore(), 'clients/c1/notes/n1'), { text: 'seed' })
    await setDoc(doc(ctx.firestore(), 'allowlist/member@example.com'), { role: 'member' })
    await setDoc(doc(ctx.firestore(), 'allowlist/owner@example.com'), { role: 'owner' })
    await setDoc(doc(ctx.firestore(), 'allowlist/member@example.com/notes/n1'), { text: 'seed' })
  })
})

afterAll(async () => {
  await env?.cleanup()
})

type TestDb = ReturnType<ReturnType<RulesTestEnvironment['unauthenticatedContext']>['firestore']>

const user = (token: Record<string, unknown>) => () =>
  env.authenticatedContext('uid-' + String(token.email), token).firestore()

interface Subject {
  label: string
  db: () => TestDb
  /** The subject's own allowlist doc, or null when it has no email. */
  own: string | null
  other: string
  ownReadable: boolean
  otherReadable: boolean
  team: boolean
  listAllowlist: boolean
}

const outsider = { email: 'outsider@example.com', email_verified: true }

const subjects: Subject[] = [
  {
    label: 'unauthenticated',
    db: () => env.unauthenticatedContext().firestore(),
    own: null,
    other: 'allowlist/member@example.com',
    ownReadable: false,
    otherReadable: false,
    team: false,
    listAllowlist: false,
  },
  {
    label: 'unverified listed email',
    db: user({ ...verifiedUser, email_verified: false }),
    own: 'allowlist/member@example.com',
    other: 'allowlist/owner@example.com',
    ownReadable: false,
    otherReadable: false,
    team: false,
    listAllowlist: false,
  },
  {
    label: 'verified token without an email',
    db: user({ email_verified: true }),
    own: null,
    other: 'allowlist/member@example.com',
    ownReadable: false,
    otherReadable: false,
    team: false,
    listAllowlist: false,
  },
  {
    label: 'outsider',
    db: user(outsider),
    own: 'allowlist/outsider@example.com',
    other: 'allowlist/member@example.com',
    ownReadable: true,
    otherReadable: false,
    team: false,
    listAllowlist: false,
  },
  {
    label: 'outsider, mixed-case token',
    db: user({ ...outsider, email: 'Outsider@Example.COM' }),
    own: 'allowlist/outsider@example.com',
    other: 'allowlist/Outsider@Example.COM',
    ownReadable: true,
    otherReadable: false,
    team: false,
    listAllowlist: false,
  },
  {
    label: 'outsider using a member email in another case as a doc id',
    db: user(outsider),
    own: 'allowlist/outsider@example.com',
    other: 'allowlist/MEMBER@example.com',
    ownReadable: true,
    otherReadable: false,
    team: false,
    listAllowlist: false,
  },
  {
    label: 'member',
    db: user(verifiedUser),
    own: 'allowlist/member@example.com',
    other: 'allowlist/owner@example.com',
    ownReadable: true,
    otherReadable: false,
    team: true,
    listAllowlist: false,
  },
  {
    label: 'member, mixed-case token',
    db: user({ ...verifiedUser, email: 'Member@Example.com' }),
    own: 'allowlist/member@example.com',
    other: 'allowlist/owner@example.com',
    ownReadable: true,
    otherReadable: false,
    team: true,
    listAllowlist: false,
  },
  {
    label: 'owner',
    db: user(verifiedOwner),
    own: 'allowlist/owner@example.com',
    other: 'allowlist/member@example.com',
    ownReadable: true,
    otherReadable: true,
    team: true,
    listAllowlist: true,
  },
  {
    label: 'owner, mixed-case token',
    db: user({ ...verifiedOwner, email: 'Owner@Example.COM' }),
    own: 'allowlist/owner@example.com',
    other: 'allowlist/member@example.com',
    ownReadable: true,
    otherReadable: true,
    team: true,
    listAllowlist: true,
  },
]

const expectRead = (allowed: boolean, read: Promise<unknown>) =>
  allowed ? assertSucceeds(read) : assertFails(read)

describe.each(subjects)('Firestore, $label', (s) => {
  it.runIf(s.own !== null)(`${s.ownReadable ? 'can' : 'cannot'} read its own allowlist doc`, async () => {
    await expectRead(s.ownReadable, getDoc(doc(s.db(), s.own!)))
  })

  it(`${s.otherReadable ? 'can' : 'cannot'} read another allowlist doc`, async () => {
    await expectRead(s.otherReadable, getDoc(doc(s.db(), s.other)))
  })

  it(`${s.listAllowlist ? 'can' : 'cannot'} list the allowlist`, async () => {
    await expectRead(s.listAllowlist, getDocs(collection(s.db(), 'allowlist')))
  })

  it(`${s.team ? 'can' : 'cannot'} read codes/abc23`, async () => {
    await expectRead(s.team, getDoc(doc(s.db(), 'codes/abc23')))
  })

  it(`${s.team ? 'can' : 'cannot'} list codes and read nested docs`, async () => {
    await expectRead(s.team, getDocs(collection(s.db(), 'codes')))
    await expectRead(s.team, getDoc(doc(s.db(), 'clients/c1/notes/n1')))
  })

  it('cannot read a subcollection under an allowlist doc', async () => {
    await assertFails(getDoc(doc(s.db(), 'allowlist/member@example.com/notes/n1')))
    await assertFails(getDocs(collection(s.db(), 'allowlist/member@example.com/notes')))
  })

  it.each([
    'codes/abc23',
    'codes/new01',
    'clients/c1/notes/n2',
    'allowlist/member@example.com',
    'allowlist/outsider@example.com',
  ])('cannot create or overwrite %s', async (path) => {
    await assertFails(setDoc(doc(s.db(), path), { role: 'owner' }))
  })

  it('cannot update or delete existing documents', async () => {
    await assertFails(updateDoc(doc(s.db(), 'codes/abc23'), { name: 'changed' }))
    await assertFails(updateDoc(doc(s.db(), 'allowlist/owner@example.com'), { role: 'member' }))
    await assertFails(deleteDoc(doc(s.db(), 'codes/abc23')))
    await assertFails(deleteDoc(doc(s.db(), 'allowlist/member@example.com')))
  })
})
