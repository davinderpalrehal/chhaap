import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { checkFile, findViolations, importSpecifiers } from './layers.ts'

const root = fileURLToPath(new URL('../', import.meta.url))

describe('layer import rules', () => {
  it('hold across the repo', () => {
    expect(findViolations(root)).toEqual([])
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
      "const g = require('g')",
    ].join('\n')
    expect(importSpecifiers(source).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
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
