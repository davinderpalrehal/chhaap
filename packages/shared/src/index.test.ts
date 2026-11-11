import { describe, expect, it } from 'vitest'

import { EmailSchema } from './index.ts'

describe('EmailSchema', () => {
  it('trims and lowercases a valid email into allowlist-key form', () => {
    expect(EmailSchema.parse('  Owner@Example.COM ')).toBe('owner@example.com')
  })

  it('accepts an already-normalised email unchanged', () => {
    expect(EmailSchema.parse('member@example.com')).toBe('member@example.com')
  })

  it.each(['', '   ', 'not-an-email', 'a@', '@example.com', 'a b@example.com'])(
    'rejects %j',
    (value) => {
      expect(EmailSchema.safeParse(value).success).toBe(false)
    },
  )

  it('rejects non-strings', () => {
    expect(EmailSchema.safeParse(42).success).toBe(false)
    expect(EmailSchema.safeParse(undefined).success).toBe(false)
  })
})
