import { defineConfig } from 'vitest/config'

// `npm run test:unit`: every workspace's unit tests plus the repo-level layers test.
// Rules tests need emulators and have their own config (vitest.rules.config.ts).
export default defineConfig({
  test: {
    projects: [
      'apps/web/vitest.config.ts',
      {
        test: {
          name: 'shared',
          root: 'packages/shared',
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'functions',
          root: 'functions',
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'repo',
          include: ['tests/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
