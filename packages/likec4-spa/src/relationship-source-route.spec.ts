// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { isNotFound } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadRelationshipDotSource, loadRelationshipTextSource } from './relationship-source-route'

const testState = vi.hoisted(() => ({
  projects: [
    {
      id: 'default',
      exportFormats: ['drawio'],
    },
  ],
  loadModel: vi.fn(),
}))

vi.mock('likec4:projects', () => ({
  projects: testState.projects,
}))

vi.mock('likec4:model', () => ({
  loadModel: testState.loadModel,
}))

describe('relationship source route helpers', () => {
  beforeEach(() => {
    testState.projects[0] = {
      id: 'default',
      exportFormats: ['drawio'],
    }
    testState.loadModel.mockReset()
  })

  it('keeps normal full-view source fallback when no relationship subject is requested', async () => {
    await expect(loadRelationshipTextSource('d2', 'default' as never, 'index', {
      relationships: undefined,
    })).resolves.toBeNull()
    expect(testState.loadModel).not.toHaveBeenCalled()
  })

  it('rejects disabled relationship text source export instead of falling back to full-view source', async () => {
    const error = await loadRelationshipTextSource('d2', 'default' as never, 'index', {
      relationships: 'cloud.backend' as never,
    }).catch(error => error)

    expect(isNotFound(error)).toBe(true)
    expect(testState.loadModel).not.toHaveBeenCalled()
  })

  it('rejects disabled relationship DOT export instead of falling back to full-view source', async () => {
    const error = await loadRelationshipDotSource('default' as never, 'index', {
      relationships: 'cloud.backend' as never,
    }).catch(error => error)

    expect(isNotFound(error)).toBe(true)
    expect(testState.loadModel).not.toHaveBeenCalled()
  })
})
