/**
 * Inbound LeanIX: read-only snapshot of LeanIX inventory (fact sheets + relations).
 * Used for reconciliation with the LikeC4 manifest; no DSL generation.
 */

import type { LeanixApiClient } from './leanix-api-client'

/** Single fact sheet as returned from LeanIX API (read-only snapshot). */
export interface LeanixFactSheetSnapshotItem {
  id: string
  name: string
  type: string
  /** Set when fetched with likec4IdAttribute and the fact sheet has that custom attribute. */
  likec4Id?: string
}

/** Single relation as returned from LeanIX API (read-only snapshot). */
export interface LeanixRelationSnapshotItem {
  id?: string
  sourceFactSheetId: string
  targetFactSheetId: string
  type: string
}

/** Read-only snapshot of LeanIX inventory for reconciliation. */
export interface LeanixInventorySnapshot {
  generatedAt: string
  /** Workspace or project identifier if available from API. */
  workspaceId?: string
  factSheets: LeanixFactSheetSnapshotItem[]
  relations: LeanixRelationSnapshotItem[]
}

export interface FetchLeanixInventorySnapshotOptions {
  /** Custom attribute key to read likec4Id from fact sheets (e.g. "likec4Id"). When set, snapshot items get likec4Id when present. */
  likec4IdAttribute?: string
  /** Max fact sheets to fetch (pagination). Default 1000. */
  maxFactSheets?: number
  /** ISO timestamp for snapshot. Default: new Date().toISOString() */
  generatedAt?: string
}

const DEFAULT_PAGE_SIZE = 100
const DEFAULT_MAX_FACT_SHEETS = 1000
const MAX_GRAPHQL_RETRIES = 3

async function withGraphQLRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < MAX_GRAPHQL_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < MAX_GRAPHQL_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
      }
    }
  }
  throw lastErr
}

/**
 * Fetches a read-only snapshot of the LeanIX inventory (fact sheets, then relations).
 * Uses cursor-based pagination. Does not modify LeanIX.
 */
export async function fetchLeanixInventorySnapshot(
  client: LeanixApiClient,
  options: FetchLeanixInventorySnapshotOptions = {},
): Promise<LeanixInventorySnapshot> {
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const maxFactSheets = options.maxFactSheets ?? DEFAULT_MAX_FACT_SHEETS
  if (!Number.isInteger(maxFactSheets) || maxFactSheets < 0) {
    throw new Error('maxFactSheets must be a non-negative integer')
  }
  const likec4IdAttribute = options.likec4IdAttribute

  const factSheets = await fetchAllFactSheets(client, {
    ...(likec4IdAttribute != null ? { likec4IdAttribute } : {}),
    maxFactSheets,
  })
  const relations = await fetchAllRelations(client, factSheets.map(f => f.id))

  return {
    generatedAt,
    factSheets,
    relations,
  }
}

type FactSheetNode = {
  id?: string
  name?: string
  type?: string
  factSheetAttributes?: Array<{ key?: string; value?: string }>
}

/** Maps a GraphQL node to LeanixFactSheetSnapshotItem; returns null when node has no id. */
function mapNodeToFactSheetItem(
  node: FactSheetNode | undefined,
  likec4IdAttribute: string | undefined,
): LeanixFactSheetSnapshotItem | null {
  if (!node?.id) return null
  const likec4Id = likec4IdAttribute != null && Array.isArray(node.factSheetAttributes)
    ? node.factSheetAttributes.find((a: { key?: string; value?: string }) => a.key === likec4IdAttribute)?.value
    : undefined
  return {
    id: node.id,
    name: node.name ?? '',
    type: node.type ?? '',
    ...(likec4Id ? { likec4Id } : {}),
  }
}

async function fetchAllFactSheets(
  client: LeanixApiClient,
  opts: { likec4IdAttribute?: string; maxFactSheets: number },
): Promise<LeanixInventorySnapshot['factSheets']> {
  const likec4IdAttribute = opts.likec4IdAttribute
  const pageSize = Math.min(DEFAULT_PAGE_SIZE, opts.maxFactSheets)
  const result: LeanixInventorySnapshot['factSheets'] = []
  let after: string | null = null
  let hasNextPage = true

  const attributeSelection = likec4IdAttribute != null
    ? `factSheetAttributes { key value }`
    : ''

  const query = `
    query AllFactSheets($first: Int!, $after: String, $filter: FilterInput) {
      allFactSheets(first: $first, after: $after, filter: $filter) {
        edges {
          node {
            id
            name
            type
            ${attributeSelection}
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `

  type PageRes = {
    allFactSheets?: {
      edges?: Array<{ node?: FactSheetNode; cursor?: string }>
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null }
    }
  }

  const fetchPage = async (cursor: string | null): Promise<PageRes> =>
    withGraphQLRetry(() =>
      client.graphql<PageRes>(query, {
        first: pageSize,
        after: cursor,
        filter: {},
      })
    )

  while (hasNextPage && result.length < opts.maxFactSheets) {
    const data: PageRes = await fetchPage(after)
    const edges = data.allFactSheets?.edges ?? []
    const pageInfo = data.allFactSheets?.pageInfo

    for (const edge of edges) {
      if (result.length >= opts.maxFactSheets) break
      const item = mapNodeToFactSheetItem(edge.node, likec4IdAttribute)
      if (item) result.push(item)
    }

    hasNextPage = pageInfo?.hasNextPage === true && result.length < opts.maxFactSheets
    after = pageInfo?.endCursor ?? null
  }

  return result
}

const RELATIONS_FETCH_CONCURRENCY = 10

async function fetchAllRelations(
  client: LeanixApiClient,
  factSheetIds: string[],
): Promise<LeanixInventorySnapshot['relations']> {
  if (factSheetIds.length === 0) return []

  const relations: LeanixRelationSnapshotItem[] = []
  const idSet = new Set(factSheetIds)

  type RelationsResult = {
    factSheet?: {
      id?: string
      relations?: {
        edges?: Array<{
          node?: {
            id?: string
            type?: string
            targetFactSheet?: { id?: string }
          }
        }>
      }
    }
  }

  const query = `
    query FactSheetRelations($id: ID!) {
      factSheet(id: $id) {
        id
        relations {
          edges {
            node {
              id
              type
              targetFactSheet { id }
            }
          }
        }
      }
    }
  `

  for (let i = 0; i < factSheetIds.length; i += RELATIONS_FETCH_CONCURRENCY) {
    const batch = factSheetIds.slice(i, i + RELATIONS_FETCH_CONCURRENCY)
    const results = await Promise.all(
      batch.map(sourceId => withGraphQLRetry(() => client.graphql<RelationsResult>(query, { id: sourceId }))),
    )
    for (let j = 0; j < results.length; j++) {
      const data = results[j]
      const sourceId = batch[j]
      if (sourceId === undefined) continue
      const edges = data?.factSheet?.relations?.edges ?? []
      for (const edge of edges) {
        const node = edge.node
        const targetId = node?.targetFactSheet?.id
        if (!targetId || !idSet.has(targetId)) continue
        relations.push({
          ...(node?.id ? { id: node.id } : {}),
          sourceFactSheetId: sourceId,
          targetFactSheetId: targetId,
          type: node?.type ?? 'RELATES_TO',
        })
      }
    }
  }

  return relations
}
