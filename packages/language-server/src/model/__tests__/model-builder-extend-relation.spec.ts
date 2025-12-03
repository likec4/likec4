import { values } from 'remeda'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

// NOTE: These unit tests verify the extend relation matching logic and edge cases.
// For comprehensive end-to-end testing including metadata merging, tag deduplication,
// and link deduplication, see:
// - packages/likec4/src/LikeC4.relation-extend.integration.spec.ts
// - examples/multi-relation-extend/

describe('Model Builder - Extend Relation', () => {
  it('does not extend relation when title does not match', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component sourceNode
        component targetNode
        sourceNode -> targetNode "Makes requests"
      }
    `)
    await validate(`
      model {
        // Wrong title - should not match
        extend sourceNode -> targetNode "Different title" {
          metadata {
            protocol 'HTTP'
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const relations = values(model.$data.relations)
    expect(relations).toHaveLength(1)
    const relation = relations[0]
    // Should not have metadata from the extend
    expect(relation?.metadata).toBeUndefined()
  })

  it('does not extend relation when kind does not match', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
        relationship sync
        relationship async
      }
      model {
        component sourceNode
        component targetNode
        sourceNode -[sync]-> targetNode
      }
    `)
    await validate(`
      model {
        // Wrong kind - should not match
        extend sourceNode -[async]-> targetNode {
          metadata {
            protocol 'HTTP'
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const relations = values(model.$data.relations)
    expect(relations).toHaveLength(1)
    const relation = relations[0]
    expect(relation?.kind).toBe('sync')
    // Should not have metadata from the extend
    expect(relation?.metadata).toBeUndefined()
  })

  it('deduplicates links with same URL and title from multiple extends', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component sourceNode
        component targetNode
        sourceNode -> targetNode
      }
    `)
    // First extend adds links
    await validate(`
      model {
        extend sourceNode -> targetNode {
          link https://example.com/docs "API Docs"
          link https://example.com/docs "User Guide"
        }
      }
    `)
    // Second extend tries to add duplicate and new links
    await validate(`
      model {
        extend sourceNode -> targetNode {
          link https://example.com/docs "API Docs"  // Should be deduplicated
          link https://example.com/docs "Admin Guide"  // Should be added
          link https://security.example.com "Security"
        }
      }
    `)

    const model = await buildLikeC4Model()
    const relations = values(model.$data.relations)
    expect(relations).toHaveLength(1)
    const relation = relations[0]
    expect(relation?.links).toHaveLength(4) // Should have 4 unique links

    const linkTitles = new Set(relation?.links?.map(l => l.title))
    expect(linkTitles).toEqual(new Set(['API Docs', 'User Guide', 'Admin Guide', 'Security']))

    // Verify that "API Docs" appears only once (was deduplicated)
    const apiDocsCount = relation?.links?.filter(l => l.title === 'API Docs').length
    expect(apiDocsCount).toBe(1)
  })

  it('merges and deduplicates tags from multiple extends', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
        tag alpha
        tag beta
        tag gamma
      }
      model {
        component a
        component b
        a -> b
      }
    `)

    // First extend adds tags alpha, beta
    await validate(`
      model {
        extend a -> b {
          #alpha #beta
        }
      }
    `)
    // Second extend adds beta (duplicate) and gamma
    await validate(`
      model {
        extend a -> b {
          #beta #gamma
        }
      }
    `)

    const model = await buildLikeC4Model()
    const relations = values(model.$data.relations)
    expect(relations).toHaveLength(1)
    const relation = relations[0]
    expect(relation?.tags).toBeDefined()
    expect(relation?.tags).toEqual(expect.arrayContaining(['alpha', 'beta', 'gamma']))
    // Ensure de-duplication (beta only once)
    const unique = Array.from(new Set(relation?.tags))
    expect(unique.length).toBe(3)
  })
})
