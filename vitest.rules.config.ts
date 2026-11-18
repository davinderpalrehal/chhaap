import { defineConfig } from 'vitest/config'

// Run through `npm run test:rules`, which starts the Firestore and Storage emulators:
// the rules tests plus the functions' emulator tests (auth.ts, owner bootstrap).
export default defineConfig({
  test: {
    name: 'rules',
    include: ['tests/rules/**/*.test.ts', 'functions/src/**/*.emulator.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
