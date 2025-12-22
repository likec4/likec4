import { resolve } from 'node:path'
import { describe, it } from 'vitest'
import { LikeC4 } from './LikeC4'

function findRelations(model: any, filter: (r: any) => boolean) {
  return Object.values(model.relations as Record<string, any>).filter(filter)
}

describe('Integration: relation extend in examples/multi-relation-extend', () => {
  it('merges metadata correctly for untyped and sync relations with same title', async ({ expect }) => {
    const workspace = resolve(__dirname, '../../../examples/multi-relation-extend')
    const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, printErrors: false })

    const model = likec4.syncComputedModel()

    // Untyped: frontend -> api "Makes requests"
    const untyped = findRelations(
      model.$data,
      (r) => !r.kind && r.title === 'Makes requests' && r.source.model === 'frontend' && r.target.model === 'api',
    )
    expect(untyped).toHaveLength(1)
    expect(untyped[0].metadata).toMatchObject({
      latency_p95: '150ms',
      rate_limit: '1000req/s',
      encryption: 'TLS 1.3',
      authentication: 'OAuth2',
    })

    // Sync: frontend -[sync]-> api "Makes requests"
    const sync = findRelations(
      model.$data,
      (r) =>
        r.kind === 'sync' && r.title === 'Makes requests' && r.source.model === 'frontend' && r.target.model === 'api',
    )
    expect(sync).toHaveLength(1)
    expect(sync[0].metadata).toMatchObject({
      format: 'JSON',
      latency_p95: '80ms',
      cache_enabled: 'true',
      encryption: 'TLS 1.2',
      cors_enabled: 'true',
    })
  })

  it('correctly handles async relation with different title', async ({ expect }) => {
    const workspace = resolve(__dirname, '../../../examples/multi-relation-extend')
    const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, printErrors: false })

    const model = likec4.syncComputedModel()

    // Async: frontend -[async]-> api "Sends analytics data"
    const async = findRelations(
      model.$data,
      (r) =>
        r.kind === 'async' &&
        r.title === 'Sends analytics data' &&
        r.source.model === 'frontend' &&
        r.target.model === 'api',
    )
    expect(async).toHaveLength(1)
    expect(async[0].metadata).toMatchObject({
      protocol: 'gRPC',
      batch_size: '100',
      latency_p95: '500ms',
      compression: 'gzip',
    })
  })

  it('normalizes empty title correctly (no title and empty string are same)', async ({ expect }) => {
    const workspace = resolve(__dirname, '../../../examples/multi-relation-extend')
    const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, printErrors: false })

    const model = likec4.syncComputedModel()

    // Both "userDB -> authService" and 'userDB -> authService ""' should be treated as same relation
    const relations = findRelations(
      model.$data,
      (r) => r.source.model === 'userDB' && r.target.model === 'authService',
    )

    // Should have exactly 2 relations (one with no title, one with empty string, both get same extends)
    expect(relations).toHaveLength(2)

    // Both should have the same extends applied
    for (const rel of relations) {
      expect(rel.metadata).toMatchObject({
        response_time: '20ms',
        read_only: 'true',
        empty_title_test: 'yes',
        special_case: 'empty_string',
      })
      expect(rel.tags).toEqual(expect.arrayContaining(['db', 'internal', 'empty_title']))
    }
  })

  it('merges metadata into arrays when values differ', async ({ expect }) => {
    const workspace = resolve(__dirname, '../../../examples/multi-relation-extend')
    const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, printErrors: false })

    const model = likec4.syncComputedModel()

    // api -> authService "Validates tokens" has protocol merged from multiple extends
    const relations = findRelations(
      model.$data,
      (r) => r.source.model === 'api' && r.target.model === 'authService' && r.title === 'Validates tokens',
    )
    expect(relations).toHaveLength(1)
    const rel = relations[0]

    // Protocol should be an array with merged values
    expect(rel.metadata.protocol).toEqual(expect.arrayContaining(['REST', 'gRPC']))
    expect(rel.metadata.timeout).toBe('5s')
    expect(rel.metadata.retry_policy).toBe('exponential')
  })

  it('deduplicates metadata when values are same', async ({ expect }) => {
    const workspace = resolve(__dirname, '../../../examples/multi-relation-extend')
    const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, printErrors: false })

    const model = likec4.syncComputedModel()

    // authService -> userDB "Queries users" has connection_type in base and extend (same value)
    const relations = findRelations(
      model.$data,
      (r) => r.source.model === 'authService' && r.target.model === 'userDB' && r.title === 'Queries users',
    )
    expect(relations).toHaveLength(1)
    const rel = relations[0]

    // connection_type should be a single string (deduplicated), not an array
    expect(rel.metadata.connection_type).toBe('connection_pool')
    expect(Array.isArray(rel.metadata.connection_type)).toBe(false)
    expect(rel.metadata.max_connections).toBe('50')
    expect(rel.metadata.query_timeout).toBe('3s')
  })

  it('deduplicates and merges tags correctly', async ({ expect }) => {
    const workspace = resolve(__dirname, '../../../examples/multi-relation-extend')
    const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, printErrors: false })

    const model = likec4.syncComputedModel()

    // api -> userDB "Stores data" has tags from base and extends
    const relations = findRelations(
      model.$data,
      (r) => r.source.model === 'api' && r.target.model === 'userDB' && r.title === 'Stores data',
    )
    expect(relations).toHaveLength(1)
    const rel = relations[0]

    // Should have all unique tags from base and extends
    expect(rel.tags).toEqual(expect.arrayContaining(['baseTag', 'security', 'ops', 'compliance']))
    // Ensure no duplicates
    const uniqueTags = new Set(rel.tags)
    expect(uniqueTags.size).toBe(rel.tags?.length)
  })

  it('deduplicates links with same URL and title', async ({ expect }) => {
    const workspace = resolve(__dirname, '../../../examples/multi-relation-extend')
    const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, printErrors: false })

    const model = likec4.syncComputedModel()

    // frontend -> api "Makes requests" (untyped) has duplicate links
    const relations = findRelations(
      model.$data,
      (r) => !r.kind && r.title === 'Makes requests' && r.source.model === 'frontend' && r.target.model === 'api',
    )
    expect(relations).toHaveLength(1)
    const rel = relations[0]

    // Check that duplicate links are removed
    const linkUrls = rel.links?.map((l: any) => ({ url: l.url, title: l.title })) || []
    const uniqueLinks = Array.from(new Set(linkUrls.map((l: any) => `${l.url}|${l.title || ''}`)))
    expect(uniqueLinks.length).toBe(rel.links?.length)
  })
})
