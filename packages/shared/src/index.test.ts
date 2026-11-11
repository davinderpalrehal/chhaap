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

  it('accepts up to 254 characters after trimming and rejects 255', () => {
    // 64-char local part + '@' + labels of up to 63 chars, ending in '.com'.
    const emailOfLength = (length: number) => {
      const domainLength = length - 65 - '.com'.length
      const labels = Array.from({ length: Math.ceil(domainLength / 63) }, () => '')
      for (let i = 0; i < domainLength - (labels.length - 1); i++) labels[i % labels.length] += 'b'
      return `${'a'.repeat(64)}@${labels.join('.')}.com`
    }
    const max = emailOfLength(254)
    const tooLong = emailOfLength(255)
    expect(max).toHaveLength(254)
    expect(tooLong).toHaveLength(255)
    expect(EmailSchema.parse(`  ${max}  `)).toBe(max)
    expect(EmailSchema.safeParse(tooLong).success).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(EmailSchema.safeParse(42).success).toBe(false)
    expect(EmailSchema.safeParse(undefined).success).toBe(false)
  })
})
