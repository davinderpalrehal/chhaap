import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// The `demo-chhaap` demo config. A `demo-` project id can only talk to the
// Emulator Suite, never to production. The production config lands with Story 1.4.
const config = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-chhaap.firebaseapp.com',
  projectId: 'demo-chhaap',
}

export const app = initializeApp(config)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Emulator ports from firebase.json.
if (config.projectId.startsWith('demo-')) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
