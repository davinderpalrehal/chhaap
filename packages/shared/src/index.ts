import { z } from 'zod'

/**
 * A team member's email in allowlist-key form (AD-8): trimmed, lowercased and
 * a valid address. `allowlist/{EmailSchema output}` is the document id.
 */
export const EmailSchema = z.string().trim().toLowerCase().pipe(z.email())

export type Email = z.output<typeof EmailSchema>
