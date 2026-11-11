import type { Request } from 'firebase-functions/v2/https'
import { onRequest } from 'firebase-functions/v2/https'

type Response = Parameters<Parameters<typeof onRequest>[0]>[1]

/**
 * Placeholder for the chhaap.link edge (AD-9). Until the redirect epic lands,
 * every path is not found and nothing is read from Firestore.
 */
export function handleRedirect(_req: Request, res: Response): void {
  res.status(404).set('Cache-Control', 'no-store').type('text/plain').send('Not found')
}

export const redirect = onRequest({ invoker: 'public' }, handleRedirect)
