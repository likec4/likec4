import { describe, expect, it } from 'vitest'
import type { LeanixApiClient } from './leanix-api-client'
import { fetchLeanixInventorySnapshot } from './leanix-inventory-snapshot'

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

type FactSheetInput = {
  id: string
  name: string
  type: string
  /** Value for the configurable attribute key (see likec4IdAttribute). */
  likec4Id?: string
  [attrKey: string]: string | undefined
}

/** Relations per source factSheet id: list of { targetId, id?, type? }. */
type RelationsMap = Map<string, Array<{ targetId: string; id?: string; type?: string }>>

/** Mock client: fact sheets, optional attribute key for likec4Id, and optional relations (with pagination). */
function createMockSnapshotClient(
  factSheets: FactSheetInput[],
  options: {
    likec4IdAttribute?: string
    relations?: RelationsMap
  } = {},
): LeanixApiClient {
  const { likec4IdAttribute = 'likec4Id', relations: relationsMap = new Map() } = options
  const attributeKey = likec4IdAttribute
  const hasAttr = factSheets.some(f => f[attributeKey] != null)

  return {
    graphql: async (query: string, variables?: Record<string, unknown>) => {
      if (query.includes('AllFactSheets') || query.includes('allFactSheets')) {
        const first = (variables != null && 'first' in variables ? (variables['first'] as number) : undefined) ?? 100
        const edges = factSheets.slice(0, first).map(node => ({
          node: {
            id: node.id,
            name: node.name,
            type: node.type,
            ...(hasAttr && node[attributeKey] != null
              ? { factSheetAttributes: [{ key: attributeKey, value: node[attributeKey] }] }
              : {}),
          },
          cursor: node.id,
        }))
        return {
          allFactSheets: {
            edges,
            pageInfo: {
              hasNextPage: factSheets.length > first,
              endCursor: factSheets[first - 1]?.id ?? null,
            },
          },
        }
      }
      if (query.includes('factSheet(id:') || query.includes('FactSheetRelations')) {
        const sourceId = variables != null && typeof variables['id'] === 'string' ? variables['id'] : undefined
        const rels: Array<{ targetId: string; id?: string; type?: string }> = sourceId
          ? relationsMap.get(sourceId) ?? []
          : []
        const idSet = new Set(factSheets.map(f => f.id))
        const edges = rels
          .filter((r: { targetId: string }) => idSet.has(r.targetId))
          .map((r: { targetId: string; id?: string; type?: string }) => ({
            node: {
              id: r.id ?? `rel-${sourceId}-${r.targetId}`,
              type: r.type ?? 'RELATES_TO',
              targetFactSheet: { id: r.targetId },
            },
          }))
        return { factSheet: { id: sourceId, relations: { edges } } }
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

    expect(snapshot.factSheets).toHaveLength(2)
  })

  it('returns relations when mock provides relation edges for fact sheets', async () => {
    const factSheets = [
      { id: 'fs-1', name: 'App1', type: 'Application' },
      { id: 'fs-2', name: 'App2', type: 'Application' },
    ]
    const relations = new Map<string, Array<{ targetId: string; id?: string; type?: string }>>()
    relations.set('fs-1', [{ targetId: 'fs-2', id: 'rel-1', type: 'RELATES_TO' }])
    const client = createMockSnapshotClient(factSheets, { relations })
    const snapshot = await fetchLeanixInventorySnapshot(client, {
      generatedAt: FIXED_DATE,
      maxFactSheets: 10,
    })

    expect(snapshot.factSheets).toHaveLength(2)
    expect(snapshot.relations).toHaveLength(1)
    expect(snapshot.relations[0]).toMatchObject({
      sourceFactSheetId: 'fs-1',
      targetFactSheetId: 'fs-2',
      type: 'RELATES_TO',
    })
  })

  it('uses configurable likec4IdAttribute when set', async () => {
    const factSheets = [
      { id: 'fs-1', name: 'Cloud', type: 'Application', customId: 'cloud' },
    ]
    const client = createMockSnapshotClient(factSheets, { likec4IdAttribute: 'customId' })
    const snapshot = await fetchLeanixInventorySnapshot(client, {
      generatedAt: FIXED_DATE,
      likec4IdAttribute: 'customId',
    })

    expect(snapshot.factSheets).toHaveLength(1)
    expect(snapshot.factSheets[0]!.likec4Id).toBe('cloud')
  })
})
