// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured } from '../__tests__/test-utils'

const DSL = `
  specification {
    element system
    deploymentNode node
    tag public
  }
  model {
    frontend = system 'Frontend' {
      #public
      description 'Renders the checkout page'
    }
    backend = system 'Backend'
  }
  deployment {
    prod = node 'Production' {
      description 'Hosts the checkout cluster'
    }
  }
`

async function search(pair: Awaited<ReturnType<typeof createMCPTestPair>>, query: string) {
  const result = await pair.client.callTool({
    name: 'search-element',
    arguments: { search: query },
  })
  return structured(result) as { total: number; found: Array<any> }
}

describe('search-element tool', () => {
  it('returns description, null when absent', async () => {
    await using pair = await createMCPTestPair(DSL)

    const { found } = await search(pair, 'kind:system')
    const fe = found.find(e => e.id === 'frontend')
    const be = found.find(e => e.id === 'backend')
    expect(fe.description).toBe('Renders the checkout page')
    expect(be.description).toBeNull()
  })

  it('matches plain-text search against description', async () => {
    await using pair = await createMCPTestPair(DSL)

    const { total, found } = await search(pair, 'CHECKOUT')
    expect(total).toBe(2)
    expect(found.map(e => [e.type, e.id])).toEqual([
      ['element', 'frontend'],
      ['deployment-node', 'prod'],
    ])
    expect(found[1].description).toBe('Hosts the checkout cluster')
  })

  it('does not match description for prefixed searches', async () => {
    await using pair = await createMCPTestPair(DSL)

    expect((await search(pair, 'kind:checkout')).total).toBe(0)
    expect((await search(pair, '#checkout')).total).toBe(0)
  })
})
