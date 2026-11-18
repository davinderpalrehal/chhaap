import { EmailSchema } from '@chhaap/shared'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { auth, db } from '@/firebase'

export type SessionStatus = 'loading' | 'signed-out' | 'not-authorised' | 'member' | 'owner'

/**
 * Decides what a Firebase user may see (AD-8): a verified email whose own
 * `allowlist/{lowercased email}` doc exists. Any read error means not authorised.
 */
async function statusOf(user: User | null): Promise<SessionStatus> {
  if (!user) return 'signed-out'
  const email = EmailSchema.safeParse(user.email)
  if (!user.emailVerified || !email.success) return 'not-authorised'
  try {
    const snap = await getDoc(doc(db, 'allowlist', email.data))
    if (!snap.exists()) return 'not-authorised'
    return snap.get('role') === 'owner' ? 'owner' : 'member'
  } catch {
    return 'not-authorised'
  }
}

export const useSessionStore = defineStore('session', () => {
  const status = ref<SessionStatus>('loading')
  const email = ref<string | null>(null)
  const error = ref<string | null>(null)

  let markReady!: () => void
  /** Resolves once the first auth state and its allowlist read are known. */
  const ready = new Promise<void>((resolve) => (markReady = resolve))

  // Auth events and sign-in can overlap; only the latest settle may write.
  let latest = 0
  async function settle(user: User | null): Promise<void> {
    const call = ++latest
    const next = await statusOf(user)
    if (call !== latest) return
    status.value = next
    error.value = null
    email.value = user?.email ?? null
    markReady()
  }

  let started = false
  /** Subscribes to Firebase auth state. Call once before the app mounts. */
  function init(): void {
    if (started) return
    started = true
    onAuthStateChanged(auth, (user) => void settle(user))
  }

  async function signIn(): Promise<void> {
    error.value = null
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider())
      await settle(user)
    } catch {
      error.value = 'Sign-in did not complete. Please try again.'
    }
  }

  async function signOut(): Promise<void> {
    await firebaseSignOut(auth)
    await settle(null)
  }

  return { status, email, error, ready, init, signIn, signOut }
})
