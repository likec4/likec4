import { describe, expect, it } from 'vitest'
import { resolveForceColorScheme } from './searchParams'

describe('resolveForceColorScheme', () => {
  it('should force light/dark and pass through auto/undefined', () => {
    expect(resolveForceColorScheme('light')).toBe('light')
    expect(resolveForceColorScheme('dark')).toBe('dark')
    expect(resolveForceColorScheme('auto')).toBeUndefined()
    expect(resolveForceColorScheme(undefined)).toBeUndefined()
  })
})

describe('--theme build option', () => {
  // Logic from __root.tsx: theme === 'auto' ? 'auto' : __DEFAULT_THEME__
  // Logic from config-app.prod.ts: JSON.stringify(cfg?.theme ?? 'auto')
  const deriveDefault = (url: string | undefined, build: string) => url === 'auto' ? 'auto' : build
  const defineValue = (theme: string | undefined) => JSON.stringify(theme ?? 'auto')

  it('should default to auto when --theme is omitted', () => {
    expect(defineValue(undefined)).toBe('"auto"')
    expect(deriveDefault(undefined, 'auto')).toBe('auto')
  })

  it('should use build default when no URL override', () => {
    expect(defineValue('dark')).toBe('"dark"')
    expect(deriveDefault(undefined, 'dark')).toBe('dark')
  })

  it('should restore auto when URL explicitly requests ?theme=auto', () => {
    expect(deriveDefault('auto', 'dark')).toBe('auto')
    expect(deriveDefault('auto', 'light')).toBe('auto')
  })
})
