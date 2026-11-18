import { describe, expect, it } from 'vitest'
import { LikeC4AppOptionsSchema, resolveAppOptions } from './app-options'

describe('resolveAppOptions', () => {
  it('applies defaults', () => {
    expect(resolveAppOptions({})).toEqual({
      title: 'LikeC4',
      useHashHistory: false,
      webcomponentPrefix: 'likec4',
    })
  })

  it('keeps the given options', () => {
    const options = {
      title: 'ACME',
      theme: 'dark',
      useHashHistory: true,
      webcomponentPrefix: 'acme',
      customization: './likec4.customization.tsx',
    } as const

    expect(resolveAppOptions(options)).toEqual(options)
  })

  it('falls back to the deprecated appConfig', () => {
    expect(
      resolveAppOptions({}, { pageTitle: 'Legacy', theme: 'light', useHashHistory: true, webcomponentPrefix: 'old' }),
    ).toEqual({
      title: 'Legacy',
      theme: 'light',
      useHashHistory: true,
      webcomponentPrefix: 'old',
    })
  })

  it('prefers the top-level options over the deprecated appConfig', () => {
    const resolved = resolveAppOptions(
      { title: 'New', webcomponentPrefix: 'new' },
      { pageTitle: 'Legacy', webcomponentPrefix: 'old', theme: 'dark' },
    )

    expect(resolved).toMatchObject({ title: 'New', webcomponentPrefix: 'new', theme: 'dark' })
  })
})

describe('LikeC4AppOptionsSchema', () => {
  it('rejects an unknown theme', () => {
    expect(LikeC4AppOptionsSchema.safeParse({ theme: 'auto' }).success).toBe(false)
  })

  it('rejects an empty title', () => {
    expect(LikeC4AppOptionsSchema.safeParse({ title: '' }).success).toBe(false)
  })
})
