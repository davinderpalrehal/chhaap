# Deferred work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-set-up-the-project-skeleton.md`
  summary: Decide how `functions` ships `@chhaap/shared` (a TypeScript-source workspace) to Cloud Functions at deploy, e.g. bundle or vendor at predeploy.
  evidence: `packages/shared` exports `./src/index.ts` and Firebase deploy uploads only `functions/`; nothing imports shared from functions yet. Belongs to Story 1.4.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-set-up-the-project-skeleton.md`
  summary: Add the production app origin to `storage.cors.json` and production Hosting targets (`app`, `link`) to `.firebaserc`; consider cache and security headers on the app site.
  evidence: Story 1.1 forbids production ids; CORS allows only `http://localhost:5173` and `.firebaserc` maps only `demo-chhaap`. Belongs to Story 1.4.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-5-adopt-vuetify-4-in-apps-web.md`
  summary: Add an e2e check that a focused, enabled `v-btn` shows the `--color-focus` outline from the `app` layer.
  evidence: Vuetify's `.v-btn { outline: none }` is beaten only by layer order and no test covers it; the shell has no enabled button until Story 1.2 wires sign-in.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-5-adopt-vuetify-4-in-apps-web.md`
  summary: Add `--color-accent-text` → `on-primary` to the token mapping list in AGENTS.md's Styling section.
  evidence: `plugins/vuetify.ts` maps it and `theme.spec.ts` now checks it, but the documented list omits it; agent-context edits are deferred by the review rules.
