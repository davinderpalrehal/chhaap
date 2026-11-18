# Deferred work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-set-up-the-project-skeleton.md`
  summary: Decide how `functions` ships `@chhaap/shared` (a TypeScript-source workspace) to Cloud Functions at deploy, e.g. bundle or vendor at predeploy.
  evidence: `packages/shared` exports `./src/index.ts` and Firebase deploy uploads only `functions/`; since Story 1.2, `functions/src/auth.ts` and `functions/src/bootstrap-owner.ts` import `EmailSchema` from it (not yet reachable from `src/index.ts`). Belongs to Story 1.4.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-set-up-the-project-skeleton.md`
  summary: Add the production app origin to `storage.cors.json` and production Hosting targets (`app`, `link`) to `.firebaserc`; consider cache and security headers on the app site.
  evidence: Story 1.1 forbids production ids; CORS allows only `http://localhost:5173` and `.firebaserc` maps only `demo-chhaap`. Belongs to Story 1.4.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-5-adopt-vuetify-4-in-apps-web.md`
  summary: Add `--color-accent-text` → `on-primary` to the token mapping list in AGENTS.md's Styling section.
  evidence: `plugins/vuetify.ts` maps it and `theme.spec.ts` now checks it, but the documented list omits it; agent-context edits are deferred by the review rules.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-sign-in-with-google-limited-to-the-team-allowlist.md`
  summary: Document in AGENTS.md that `npm run test:e2e` starts its own Auth and Firestore emulators and fails while `npm run dev` holds ports 9099/8080 (stop dev first, or reuse running emulators).
  evidence: root `test:e2e` wraps Playwright in `firebase emulators:exec` on the same ports `npm run dev` uses; agent-context edits are deferred by the review rules.
