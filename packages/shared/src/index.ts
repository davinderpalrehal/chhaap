import { z } from 'zod'

/**
 * A team member's email in allowlist-key form (AD-8): trimmed, lowercased, a
 * valid address and at most 254 characters (RFC 5321), which keeps the
 * `allowlist/{EmailSchema output}` document id well within Firestore's limit.
 */
export const EmailSchema = z.string().trim().max(254).toLowerCase().pipe(z.email())

export type Email = z.output<typeof EmailSchema>
