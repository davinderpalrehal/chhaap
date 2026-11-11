import { defineConfig } from 'vitest/config'

// Run through `npm run test:rules`, which starts the Firestore and Storage emulators.
export default defineConfig({
  test: {
    name: 'rules',
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
