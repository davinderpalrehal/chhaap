# Deferred work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-set-up-the-project-skeleton.md`
  summary: Decide how `functions` ships `@chhaap/shared` (a TypeScript-source workspace) to Cloud Functions at deploy, e.g. bundle or vendor at predeploy.
  evidence: `packages/shared` exports `./src/index.ts` and Firebase deploy uploads only `functions/`; nothing imports shared from functions yet. Belongs to Story 1.4.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-set-up-the-project-skeleton.md`
  summary: Add the production app origin to `storage.cors.json` and production Hosting targets (`app`, `link`) to `.firebaserc`; consider cache and security headers on the app site.
  evidence: Story 1.1 forbids production ids; CORS allows only `http://localhost:5173` and `.firebaserc` maps only `demo-chhaap`. Belongs to Story 1.4.
