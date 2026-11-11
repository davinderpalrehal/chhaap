# AGENTS.md — Chhaap

Instructions for every agent working in this repo (Claude, Codex, Gemini and the sessions bmad-loop starts).

## Workflow rules

1. **Every task is on the board.** Every task is on the [Chhaap Project board](https://github.com/users/davinderpalrehal/projects/15) (GitHub Project #15). If a task is missing, add it before working on it.
2. **One branch per task.** Every task gets its own branch, unless an exception is called out.
3. **Features and bug fixes** branch from the latest `origin/develop`.
4. **Hotfixes** branch from the latest `origin/main`.
5. **Releases** merge `develop` into `main`, with a changelog of the new features and bug fixes.
6. **Release cadence.** Release candidates are ready by Friday each week, and releases happen on Monday. The only exception is a hotfix that can't wait.

Never commit directly to `develop` or `main`. Work reaches `develop` through a pull request.

## Commands

There is no application code yet. Story 1.1 (issue #20) fills this section in with the install, dev, test and lint commands.

## Planning artifacts

- Spec (canonical contract): `_bmad-output/specs/spec-Chhaap/SPEC.md`
- Architecture spine (AD-1 to AD-12, pinned stack): `_bmad-output/planning-artifacts/architecture/architecture-Chhaap-2026-11-10/ARCHITECTURE-SPINE.md`
- Epics and stories: `_bmad-output/planning-artifacts/epics.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
