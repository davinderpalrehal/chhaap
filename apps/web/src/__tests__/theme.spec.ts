import { describe, expect, it } from 'vitest'

import tokens from '../styles/tokens.css?raw'
import vuetify, { lightTheme, parseColorTokens } from '../plugins/vuetify'

describe('Vuetify theme', () => {
  const colors = parseColorTokens(tokens)

  it('reads the --color-* tokens from tokens.css', () => {
    expect(colors.accent).toMatch(/^#[0-9a-f]{6}$/i)
    expect(colors.bg).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('maps the brand tokens onto the light theme', () => {
    expect(lightTheme().colors).toMatchObject({
      primary: colors.accent,
      background: colors.bg,
      surface: colors.surface,
      'on-surface': colors.text,
      'on-background': colors.text,
    })
  })

  it('is the default theme', () => {
    expect(vuetify.theme.global.name.value).toBe('light')
    expect(vuetify.theme.themes.value.light?.colors.primary).toBe(colors.accent)
  })

  it('fails loudly when a token is missing', () => {
    expect(() => lightTheme(':root { --color-bg: #fff; }')).toThrow(/--color-accent/)
  })
})
