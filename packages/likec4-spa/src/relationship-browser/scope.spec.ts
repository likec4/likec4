// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import {
  isRelationshipBrowserScope,
  readRelationshipBrowserScope,
  relationshipBrowserScopeStorageKey,
  resolveRelationshipBrowserScope,
  saveRelationshipBrowserScope,
} from './scope'

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

describe('resolveRelationshipBrowserScope', () => {
  it('uses URL scope before saved and configured scopes', () => {
    expect(resolveRelationshipBrowserScope({
      urlScope: 'global',
      savedScope: 'view',
      configuredScope: 'view',
    })).toBe('global')
  })

  it('uses saved scope before configured scope', () => {
    expect(resolveRelationshipBrowserScope({
      savedScope: 'global',
      configuredScope: 'view',
    })).toBe('global')
  })

  it('uses configured scope when no override exists', () => {
    expect(resolveRelationshipBrowserScope({ configuredScope: 'global' })).toBe('global')
  })

  it('defaults to view', () => {
    expect(resolveRelationshipBrowserScope({})).toBe('view')
  })
})

describe('relationship browser scope storage', () => {
  it('isolates saved preferences by project id', () => {
    const storage = createStorage()

    expect(saveRelationshipBrowserScope('alpha', 'global', storage)).toBe(true)
    expect(readRelationshipBrowserScope('alpha', storage)).toBe('global')
    expect(readRelationshipBrowserScope('beta', storage)).toBeUndefined()
  })

  it('ignores malformed saved values', () => {
    const storage = createStorage({
      [relationshipBrowserScopeStorageKey('alpha')]: 'all',
    })

    expect(readRelationshipBrowserScope('alpha', storage)).toBeUndefined()
  })

  it('treats storage errors as absent values', () => {
    const storage = {
      getItem() {
        throw new Error('read failed')
      },
      setItem() {
        throw new Error('write failed')
      },
    }

    expect(readRelationshipBrowserScope('alpha', storage)).toBeUndefined()
    expect(saveRelationshipBrowserScope('alpha', 'global', storage)).toBe(false)
  })
})

describe('isRelationshipBrowserScope', () => {
  it('accepts only global and view', () => {
    expect(isRelationshipBrowserScope('global')).toBe(true)
    expect(isRelationshipBrowserScope('view')).toBe(true)
    expect(isRelationshipBrowserScope('all')).toBe(false)
  })
})
