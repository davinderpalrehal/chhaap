import { setGlobalOptions } from 'firebase-functions/v2'

// AD-10: functions, Firestore and Storage all live in africa-south1.
// firebase-functions reads global options when each function is defined, and ES
// modules evaluate their imports before their own body, so this lives in its own
// module that src/index.ts imports first.
setGlobalOptions({ region: 'africa-south1' })
