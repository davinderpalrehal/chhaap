import { readdirSync, readFileSync } from 'node:fs'
import { posix } from 'node:path'

/**
 * Layer import rules from the architecture spine:
 * - `packages/shared` imports no other workspace.
 * - `packages/render` and `functions` import only `@chhaap/shared`.
 * - `apps/web` imports only `@chhaap/shared` and `@chhaap/render`.
 * So nothing but `apps/web` may import `@chhaap/render`.
 * Third-party packages are not checked here. Relative paths that leave a
 * workspace count as imports of whatever they reach.
 */
export const WORKSPACES = {
  'apps/web': { name: '@chhaap/web', mayImport: ['@chhaap/shared', '@chhaap/render'] },
  'packages/shared': { name: '@chhaap/shared', mayImport: [] },
  'packages/render': { name: '@chhaap/render', mayImport: ['@chhaap/shared'] },
  functions: { name: '@chhaap/functions', mayImport: ['@chhaap/shared'] },
} as const satisfies Record<string, { name: string; mayImport: readonly string[] }>

type WorkspaceDir = keyof typeof WORKSPACES

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?|vue)$/
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  'lib',
  'coverage',
  'test-results',
  'playwright-report',
])

const STATIC_IMPORT = /\b(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?['"]([^'"\n]+)['"]/g
const DYNAMIC_IMPORT = /\b(?:import|require)\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g

export function importSpecifiers(source: string): string[] {
  const found = new Set<string>()
  for (const re of [STATIC_IMPORT, DYNAMIC_IMPORT]) {
    for (const match of source.matchAll(re)) found.add(match[1]!)
  }
  return [...found]
}

function workspaceOf(repoPath: string): WorkspaceDir | undefined {
  return (Object.keys(WORKSPACES) as WorkspaceDir[]).find(
    (dir) => repoPath === dir || repoPath.startsWith(`${dir}/`),
  )
}

/** Returns one message per forbidden import in a file. `file` is repo-relative, posix. */
export function checkFile(file: string, source: string): string[] {
  const self = workspaceOf(file)
  if (!self) return []
  const { name, mayImport } = WORKSPACES[self]
  const allowed = new Set<string>(mayImport)
  const violations: string[] = []

  for (const spec of importSpecifiers(source)) {
    let target: string | undefined
    if (spec.startsWith('@chhaap/')) {
      target = spec.split('/').slice(0, 2).join('/')
    } else if (spec.startsWith('.')) {
      const resolved = posix.normalize(posix.join(posix.dirname(file), spec))
      const reached = workspaceOf(resolved)
      if (reached === self) continue
      target = reached ? WORKSPACES[reached].name : `outside any workspace (${resolved})`
    } else {
      continue
    }
    if (target === name || allowed.has(target)) continue
    violations.push(`${file}: ${name} must not import ${target} (via '${spec}')`)
  }
  return violations
}

function* sourceFiles(root: string, dir: string): Generator<string> {
  for (const entry of readdirSync(posix.join(root, dir), { withFileTypes: true })) {
    const path = posix.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) yield* sourceFiles(root, path)
    } else if (SOURCE_FILE.test(entry.name)) {
      yield path
    }
  }
}

export function findViolations(root: string): string[] {
  const violations: string[] = []
  for (const dir of Object.keys(WORKSPACES)) {
    for (const file of sourceFiles(root, dir)) {
      violations.push(...checkFile(file, readFileSync(posix.join(root, file), 'utf8')))
    }
  }
  return violations
}
