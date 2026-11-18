import { EmailSchema } from '@chhaap/shared'
import { getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'

export type Role = 'owner' | 'member'
export interface TeamMember {
  email: string
  role: Role
}

type Auth = CallableRequest['auth']

function defaultDb(): Firestore {
  return getFirestore(getApps().length ? getApp() : initializeApp())
}

/**
 * AD-8: the caller must have a verified email whose lowercased
 * `allowlist/{email}` doc exists. Reads the allowlist on every call and uses
 * no custom claims, so a removal takes effect on the caller's next command.
 */
export async function assertTeamMember(auth: Auth, db: Firestore = defaultDb()): Promise<TeamMember> {
  const email = EmailSchema.safeParse(auth?.token.email)
  if (!auth || auth.token.email_verified !== true || !email.success) {
    throw new HttpsError('permission-denied', 'Sign in with a verified team email.')
  }
  const snap = await db.collection('allowlist').doc(email.data).get()
  if (!snap.exists) {
    throw new HttpsError('permission-denied', 'This email is not on the team.')
  }
  return { email: email.data, role: snap.get('role') === 'owner' ? 'owner' : 'member' }
}

/** As `assertTeamMember`, and the caller's allowlist role must be `owner`. */
export async function assertOwner(auth: Auth, db: Firestore = defaultDb()): Promise<TeamMember> {
  const member = await assertTeamMember(auth, db)
  if (member.role !== 'owner') {
    throw new HttpsError('permission-denied', 'Only the owner can do this.')
  }
  return member
}
