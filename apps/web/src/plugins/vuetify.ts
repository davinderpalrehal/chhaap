import { createVuetify, type ThemeDefinition } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

import tokens from '../styles/tokens.css?raw'

/** Reads the `--color-*` custom properties from a CSS source, keyed without the prefix. */
export function parseColorTokens(css: string): Record<string, string> {
  const colors: Record<string, string> = {}
  for (const match of css.matchAll(/--color-([\w-]+)\s*:\s*([^;]+);/g)) {
    colors[match[1]!] = match[2]!.trim()
  }
  return colors
}

function token(colors: Record<string, string>, name: string): string {
  const value = colors[name]
  if (!value) throw new Error(`tokens.css has no --color-${name}`)
  return value
}

/** The light theme, built from `tokens.css` so brand colours live in one place. */
export function lightTheme(css: string = tokens): ThemeDefinition {
  const colors = parseColorTokens(css)
  return {
    dark: false,
    colors: {
      primary: token(colors, 'accent'),
      'on-primary': token(colors, 'accent-text'),
      background: token(colors, 'bg'),
      'on-background': token(colors, 'text'),
      surface: token(colors, 'surface'),
      'on-surface': token(colors, 'text'),
    },
  }
}

export default createVuetify({
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    defaultTheme: 'light',
    themes: { light: lightTheme() },
  },
})
