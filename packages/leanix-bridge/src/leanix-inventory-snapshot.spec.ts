import { describe, expect, it } from 'vitest'
import type { LeanixApiClient } from './leanix-api-client'
import { fetchLeanixInventorySnapshot } from './leanix-inventory-snapshot'

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

/** Mock client: one page of fact sheets; factSheet(id) returns empty relations. */
function createMockClient(options: {
  factSheets: Array<{ id: string; name: string; type: string; likec4Id?: string }>
  likec4IdAttribute?: string
}): LeanixApiClient {
  const { factSheets, likec4IdAttribute } = options
  return {
    graphql: async (query: string, variables?: Record<string, unknown>) => {
      if (query.includes('allFactSheets')) {
        const nodes = factSheets.map(fs => ({
          node: {
            id: fs.id,
            name: fs.name,
            type: fs.type,
            ...(likec4IdAttribute && fs.likec4Id
              ? { factSheetAttributes: [{ key: likec4IdAttribute, value: fs.likec4Id }] }
              : {}),
          },
          cursor: fs.id,
        }))
        return {
          allFactSheets: {
            edges: nodes,
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        }
      }
      if (query.includes('factSheet(id:') || query.includes('factSheet(id:')) {
        const id = variables?.['id'] as string
        return {
          factSheet: {
            id,
            relations: { edges: [] },
          },
        }
      }
      throw new Error(`Unexpected query in mock: ${query.slice(0, 60)}`)
    },
  } as LeanixApiClient
}

describe('fetchLeanixInventorySnapshot', () => {
  it('returns snapshot with fact sheets and relations from mock', async () => {
    const factSheets = [
      { id: 'fs-1', name: 'Cloud', type: 'Application' },
      { id: 'fs-2', name: 'API', type: 'ITComponent' },
    ]
    const client = createMockClient({ factSheets })

    const snapshot = await fetchLeanixInventorySnapshot(client, {
      generatedAt: FIXED_DATE,
      maxFactSheets: 100,
    })

    expect(snapshot.generatedAt).toBe(FIXED_DATE)
    expect(snapshot.factSheets).toHaveLength(2)
    expect(snapshot.factSheets[0]).toEqual({ id: 'fs-1', name: 'Cloud', type: 'Application' })
    expect(snapshot.factSheets[1]).toEqual({ id: 'fs-2', name: 'API', type: 'ITComponent' })
    expect(Array.isArray(snapshot.relations)).toBe(true)
    expect(snapshot.relations).toHaveLength(0)
  })

  it('includes likec4Id on fact sheets when likec4IdAttribute is set and attribute present', async () => {
    const factSheets = [
      { id: 'fs-1', name: 'Cloud', type: 'Application', likec4Id: 'cloud' },
      { id: 'fs-2', name: 'API', type: 'ITComponent', likec4Id: 'cloud.api' },
    ]
    const client = createMockClient({ factSheets, likec4IdAttribute: 'likec4Id' })

    const snapshot = await fetchLeanixInventorySnapshot(client, {
      generatedAt: FIXED_DATE,
      likec4IdAttribute: 'likec4Id',
    })

    expect(snapshot.factSheets[0]?.likec4Id).toBe('cloud')
    expect(snapshot.factSheets[1]?.likec4Id).toBe('cloud.api')
  })

  it('throws when maxFactSheets is negative', async () => {
    const client = createMockClient({ factSheets: [] })

    await expect(
      fetchLeanixInventorySnapshot(client, { maxFactSheets: -1 }),
    ).rejects.toThrow('maxFactSheets must be a non-negative integer')
  })
})
