import { vi } from 'vitest'

/**
 * In-memory stand-ins for the Firebase calls the session store makes. Each spec
 * that imports this must also call `vi.mock` for the three modules with the
 * factories below (vi.mock is hoisted per file).
 */
export interface FakeUser {
  email: string | null
  emailVerified: boolean
}

export const fake = {
  listener: null as ((user: FakeUser | null) => void) | null,
  /** allowlist docs by id, e.g. `{ 'member@example.com': { role: 'member' } }` */
  allowlist: {} as Record<string, { role: string }>,
  readError: false,
  popup: vi.fn<() => Promise<{ user: FakeUser }>>(),
  signOut: vi.fn<() => Promise<void>>(async () => {}),
  reads: [] as string[],
  reset() {
    this.listener = null
    this.allowlist = {}
    this.readError = false
    this.popup.mockReset()
    this.signOut.mockClear()
    this.reads = []
  },
}

export const firebaseModule = () => ({ auth: {}, db: {} })

export const authModule = () => ({
  GoogleAuthProvider: class {},
  onAuthStateChanged: (_auth: unknown, cb: (user: FakeUser | null) => void) => {
    fake.listener = cb
    return () => {}
  },
  signInWithPopup: () => fake.popup(),
  signOut: () => fake.signOut(),
})

export const firestoreModule = () => ({
  doc: (_db: unknown, coll: string, id: string) => ({ coll, id }),
  getDoc: async ({ coll, id }: { coll: string; id: string }) => {
    fake.reads.push(`${coll}/${id}`)
    if (fake.readError) throw new Error('permission-denied')
    const data = coll === 'allowlist' ? fake.allowlist[id] : undefined
    return { exists: () => data !== undefined, get: (key: 'role') => data?.[key] }
  },
})
