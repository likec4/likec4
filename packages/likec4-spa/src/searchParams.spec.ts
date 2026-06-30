// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { describe, expect, it } from 'vitest'
import { resolveForceColorScheme, searchParamsSchema } from './searchParams'

describe('resolveForceColorScheme', () => {
  it('should force light/dark and pass through auto/undefined', () => {
    expect(resolveForceColorScheme('light')).toBe('light')
    expect(resolveForceColorScheme('dark')).toBe('dark')
    expect(resolveForceColorScheme('auto')).toBeUndefined()
    expect(resolveForceColorScheme(undefined)).toBeUndefined()
  })
})

describe('relationshipScope search parameter', () => {
  it('accepts view and global scopes', () => {
    expect(searchParamsSchema.parse({ relationshipScope: 'view' }).relationshipScope).toBe('view')
    expect(searchParamsSchema.parse({ relationshipScope: 'global' }).relationshipScope).toBe('global')
  })

  it('drops invalid scopes', () => {
    expect(searchParamsSchema.parse({ relationshipScope: 'local' }).relationshipScope).toBeUndefined()
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
