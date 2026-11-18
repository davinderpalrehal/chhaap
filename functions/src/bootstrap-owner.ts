import { EmailSchema } from '@chhaap/shared'
import type { Firestore } from 'firebase-admin/firestore'

// No parameter properties: the CLI runs this file with Node's type stripping.
export class OwnerExistsError extends Error {
  readonly ownerEmail: string
  constructor(ownerEmail: string) {
    super(`An owner already exists (${ownerEmail}); nothing was written.`)
    this.name = 'OwnerExistsError'
    this.ownerEmail = ownerEmail
  }
}

/**
 * Writes `allowlist/{lowercased email} { role: 'owner' }` unless an owner
 * already exists. The check and the write share one transaction, so two
 * concurrent runs cannot both create an owner. Throws a ZodError for a bad email.
 */
export async function bootstrapOwner(db: Firestore, rawEmail: unknown): Promise<string> {
  const email = EmailSchema.parse(rawEmail)
  const allowlist = db.collection('allowlist')
  await db.runTransaction(async (tx) => {
    const owners = await tx.get(allowlist.where('role', '==', 'owner').limit(1))
    const existing = owners.docs[0]
    if (existing) throw new OwnerExistsError(existing.id)
    tx.set(allowlist.doc(email), { role: 'owner' })
  })
  return email
}
