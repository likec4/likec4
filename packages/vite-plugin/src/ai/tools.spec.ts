// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { readConnectionsDef, readElementDef, readUiStateDef, updateUiStateDef } from './tools'

describe('AI UI tools', () => {
  it('allows opting into edges and relationship metadata', () => {
    expect(
      readUiStateDef.inputSchema?.safeParse({
        edges: true,
        edgeRelations: true,
      }).success,
    ).toBe(true)
  })

  it('has a dedicated connections tool without required parameters', () => {
    expect(readConnectionsDef.inputSchema?.safeParse({}).success).toBe(true)
  })

  it('can read the selected element or an explicit element id', () => {
    expect(readElementDef.inputSchema?.safeParse({}).success).toBe(true)
    expect(readElementDef.inputSchema?.safeParse({ elementId: 'cloud.backend' }).success).toBe(true)
    expect(readElementDef.inputSchema?.safeParse({ elementId: '' }).success).toBe(false)
  })

  it('requires elementId for focus commands', () => {
    expect(
      updateUiStateDef.inputSchema?.safeParse({
        command: {
          type: 'focus',
        },
      }).success,
    ).toBe(false)

    expect(
      updateUiStateDef.inputSchema?.safeParse({
        command: {
          type: 'fitview',
        },
      }).success,
    ).toBe(true)

    expect(
      updateUiStateDef.inputSchema?.safeParse({
        command: {
          type: 'focus',
          elementId: 'cloud.backend',
        },
      }).success,
    ).toBe(true)
  })

  it('uses an OpenAI-compatible flat schema for commands', () => {
    const jsonSchema = z.toJSONSchema(updateUiStateDef.inputSchema!)

    expect(JSON.stringify(jsonSchema)).not.toContain('"oneOf"')
  })
})
