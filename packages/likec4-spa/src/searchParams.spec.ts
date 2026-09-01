import { describe, expect, it } from 'vitest'
import { resolveForceColorScheme, searchParamsSchema } from './searchParams'

describe('searchParamsSchema', () => {
  it('should parse valid theme options', () => {
    expect(searchParamsSchema.parse({ theme: 'light' }).theme).toBe('light')
    expect(searchParamsSchema.parse({ theme: 'dark' }).theme).toBe('dark')
    expect(searchParamsSchema.parse({ theme: 'auto' }).theme).toBe('auto')
  })

  it('should fallback to undefined for invalid or missing theme', () => {
    expect(searchParamsSchema.parse({ theme: 'invalid' }).theme).toBeUndefined()
    expect(searchParamsSchema.parse({}).theme).toBeUndefined()
  })

  it('should parse default search params', () => {
    const parsed = searchParamsSchema.parse({})
    expect(parsed.dynamic).toBe('diagram')
    expect(parsed.padding).toBe(20)
    expect(parsed.relationships).toBeUndefined()
    expect(parsed.focusOnElement).toBeUndefined()
  })
})

describe('resolveForceColorScheme', () => {
  it('should force light/dark and pass through auto/undefined', () => {
    expect(resolveForceColorScheme('light')).toBe('light')
    expect(resolveForceColorScheme('dark')).toBe('dark')
    expect(resolveForceColorScheme('auto')).toBeUndefined()
    expect(resolveForceColorScheme(undefined)).toBeUndefined()
  })
})

describe('--theme build option', () => {
  // Logic from __root.tsx: theme === 'auto' ? 'auto' : defaultTheme
  // defaultTheme comes from likec4:app-config virtual module (defaults to 'auto')
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
