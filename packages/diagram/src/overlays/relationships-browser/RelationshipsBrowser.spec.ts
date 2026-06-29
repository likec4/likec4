// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { buildRelationshipUrlFromHref } from './RelationshipsBrowser'

describe('buildRelationshipUrlFromHref', () => {
  it('adds relationship subject and scope to browser-history URLs', ({ expect }) => {
    expect(buildRelationshipUrlFromHref('https://example.com/view/index/', 'cloud.backend', 'global')).toBe(
      'https://example.com/view/index/?relationships=cloud.backend&relationshipScope=global',
    )
  })

  it('adds relationship subject and scope to hash-router URLs', ({ expect }) => {
    expect(buildRelationshipUrlFromHref('https://example.com/app/#/view/index/', 'cloud.backend', 'view')).toBe(
      'https://example.com/app/#/view/index?relationships=cloud.backend&relationshipScope=view',
    )
  })
})
