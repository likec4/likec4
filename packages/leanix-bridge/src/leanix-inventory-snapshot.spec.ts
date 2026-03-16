import { describe, expect, it } from 'vitest'
import type { LeanixApiClient } from './leanix-api-client'
import { fetchLeanixInventorySnapshot } from './leanix-inventory-snapshot'

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

/** Mock client: returns one page of fact sheets and empty relations per factSheet(id). */
function createMockSnapshotClient(
  factSheets: Array<{ id: string; name: string; type: string; likec4Id?: string }>,
): LeanixApiClient {
  const attributeSelection = factSheets.some(f => f.likec4Id != null)
  return {
    graphql: async (query: string, variables?: Record<string, unknown>) => {
      if (query.includes('AllFactSheets') || query.includes('allFactSheets')) {
        const first = (variables != null && 'first' in variables ? (variables['first'] as number) : undefined) ?? 100
        const edges = factSheets.slice(0, first).map(node => ({
          node: {
            id: node['id'],
            name: node.name,
            type: node.type,
            ...(attributeSelection && node.likec4Id
              ? {
                factSheetAttributes: [{ key: 'likec4Id', value: node.likec4Id }],
              }
              : {}),
          },
          cursor: node.id,
        }))
        return {
          allFactSheets: {
            edges,
            pageInfo: {
              hasNextPage: factSheets.length > first,
              endCursor: factSheets[first - 1]?.['id'] ?? null,
            },
          },
        }
      }
      if (query.includes('factSheet(id:') || query.includes('FactSheetRelations')) {
        return { factSheet: { id: variables != null ? variables['id'] : undefined, relations: { edges: [] } } }
      }
      throw new Error(`Unexpected query in test: ${query.slice(0, 80)}`)
    },
  } as LeanixApiClient
}

describe('fetchLeanixInventorySnapshot', () => {
  it('returns snapshot with fact sheets and relations', async () => {
    const factSheets = [
      { id: 'fs-1', name: 'App1', type: 'Application' },
      { id: 'fs-2', name: 'App2', type: 'Application' },
    ]
    const client = createMockSnapshotClient(factSheets)
    const snapshot = await fetchLeanixInventorySnapshot(client, {
      generatedAt: FIXED_DATE,
      maxFactSheets: 10,
    })

    expect(snapshot.generatedAt).toBe(FIXED_DATE)
    expect(snapshot.factSheets).toHaveLength(2)
    expect(snapshot.factSheets[0]).toEqual({ id: 'fs-1', name: 'App1', type: 'Application' })
    expect(snapshot.factSheets[1]).toEqual({ id: 'fs-2', name: 'App2', type: 'Application' })
    expect(snapshot.relations).toHaveLength(0)
  })

  it('includes likec4Id when likec4IdAttribute is set and fact sheet has attribute', async () => {
    const factSheets = [
      { id: 'fs-1', name: 'Cloud', type: 'Application', likec4Id: 'cloud' },
    ]
    const client = createMockSnapshotClient(factSheets)
    const snapshot = await fetchLeanixInventorySnapshot(client, {
      generatedAt: FIXED_DATE,
      likec4IdAttribute: 'likec4Id',
    })

    expect(snapshot.factSheets).toHaveLength(1)
    expect(snapshot.factSheets[0]!.likec4Id).toBe('cloud')
  })

  it('respects maxFactSheets', async () => {
    const factSheets = [
      { id: 'fs-1', name: 'A', type: 'Application' },
      { id: 'fs-2', name: 'B', type: 'Application' },
      { id: 'fs-3', name: 'C', type: 'Application' },
    ]
    const client = createMockSnapshotClient(factSheets)
    const snapshot = await fetchLeanixInventorySnapshot(client, {
      generatedAt: FIXED_DATE,
      maxFactSheets: 2,
    })

    expect(snapshot.factSheets.length).toBeLessThanOrEqual(2)
  })
})
