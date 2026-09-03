// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildRelationshipUrl } from './RelationshipsBrowser'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildRelationshipUrl', () => {
  it('includes the relationship and scope in a history URL', () => {
    vi.stubGlobal('window', {
      location: {
        href: 'https://example.test/architecture/view?theme=dark',
      },
    })

    const url = buildRelationshipUrl('top', 'global')

    expect(url).toContain('relationships=top')
    expect(url).toContain('relationshipsScope=global')
  })

  it('includes the relationship and scope in a hash URL', () => {
    vi.stubGlobal('window', {
      location: {
        href: 'https://example.test/architecture/#/view/top?theme=dark',
      },
    })

    const url = buildRelationshipUrl('top', 'global')

    expect(url).toContain('relationships=top')
    expect(url).toContain('relationshipsScope=global')
  })
})
