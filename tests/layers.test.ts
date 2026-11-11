import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { checkFile, findViolations, importSpecifiers } from './layers.ts'

const root = fileURLToPath(new URL('../', import.meta.url))

describe('layer import rules', () => {
  it('hold across the repo', () => {
    expect(findViolations(root)).toEqual([])
  })

  it('reports planted violations, including nested src/lib, and ignores build output', () => {
    const tree = mkdtempSync(join(tmpdir(), 'chhaap-layers-'))
    const write = (file: string, source: string) => {
      mkdirSync(dirname(join(tree, file)), { recursive: true })
      writeFileSync(join(tree, file), source)
    }
    try {
      write('apps/web/src/main.ts', "import { draw } from '@chhaap/render'")
      write('packages/shared/src/index.ts', "import { z } from 'zod'")
      write('packages/render/src/lib/draw.ts', "import x from '@chhaap/functions'")
      write('functions/src/redirect/index.ts', 'const m = await import(`@chhaap/render`)')
      write('functions/lib/index.js', "import '@chhaap/render'")
      write('apps/web/dist/assets/index.js', "import '@chhaap/functions'")

      const violations = findViolations(tree)
      expect(violations).toHaveLength(2)
      expect(violations.join('\n')).toContain('packages/render/src/lib/draw.ts')
      expect(violations.join('\n')).toContain('functions/src/redirect/index.ts')
    } finally {
      rmSync(tree, { recursive: true, force: true })
    }
  })
})

describe('importSpecifiers', () => {
  it('finds static, type-only, re-export, side-effect, multiline and dynamic imports', () => {
    const source = [
      "import a from 'a'",
      "import type { B } from 'b'",
      "export * from 'c'",
      "import 'd'",
      'import {\n  e1,\n  e2,\n} from "e"',
      "const f = await import('f')",
      'const h = await import(`h`)',
      "const g = require('g')",
    ].join('\n')
    expect(importSpecifiers(source).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
  })
})

describe('checkFile', () => {
  const forbidden: Array<[string, string]> = [
    ['functions/src/redirect/index.ts', "import { draw } from '@chhaap/render'"],
    ['functions/src/commands/x.ts', "import x from '@chhaap/web/src/main'"],
    ['functions/src/index.ts', "import x from '../../packages/render/src/index.ts'"],
    ['packages/render/src/index.ts', "import x from '@chhaap/functions'"],
    ['packages/render/src/index.ts', "import x from '../../../apps/web/src/main.ts'"],
    ['packages/shared/src/index.ts', "import x from '@chhaap/render'"],
    ['packages/shared/src/index.ts', "export * from '../../render/src/index.ts'"],
    ['packages/shared/src/index.ts', "const m = await import('@chhaap/functions')"],
    ['packages/shared/src/index.ts', "import x from '../../../tests/layers.ts'"],
    ['apps/web/src/main.ts', "import x from '@chhaap/functions'"],
  ]

  it.each(forbidden)('rejects %s: %s', (file, source) => {
    expect(checkFile(file, source)).toHaveLength(1)
  })

  const allowed: Array<[string, string]> = [
    ['functions/src/redirect/index.ts', "import { EmailSchema } from '@chhaap/shared'"],
    ['functions/src/index.ts', "import { onRequest } from 'firebase-functions/v2/https'"],
    ['functions/src/index.ts', "export { redirect } from './redirect/index.js'"],
    ['packages/render/src/index.ts', "import { EmailSchema } from '@chhaap/shared'"],
    ['packages/shared/src/index.ts', "import { z } from 'zod'"],
    ['packages/shared/src/index.ts', "import { x } from './slug.ts'"],
    ['apps/web/src/main.ts', "import { draw } from '@chhaap/render'"],
    ['apps/web/src/main.ts', "import { EmailSchema } from '@chhaap/shared'"],
    ['apps/web/src/main.ts', "import App from '@/App.vue'"],
  ]

  it.each(allowed)('accepts %s: %s', (file, source) => {
    expect(checkFile(file, source)).toEqual([])
  })
})
