import { describe, expect, it } from 'vitest'
import type { BridgeManifest } from './contracts'
import { BRIDGE_MANIFEST_VERSION, BRIDGE_VERSION } from './contracts'
import { manifestToDrawioLeanixMapping } from './drawio-leanix-roundtrip'

function minimalManifest(overrides: Partial<BridgeManifest> = {}): BridgeManifest {
  return {
    manifestVersion: BRIDGE_MANIFEST_VERSION,
    generatedAt: '2025-01-15T12:00:00.000Z',
    bridgeVersion: BRIDGE_VERSION,
    mappingProfile: 'default',
    projectId: 'test-project',
    entities: {},
    views: {},
    relations: [],
    ...overrides,
  }
}

describe('manifestToDrawioLeanixMapping', () => {
  it('empty manifest returns empty mapping', () => {
    const manifest = minimalManifest()
    const mapping = manifestToDrawioLeanixMapping(manifest)

    expect(Object.keys(mapping.likec4IdToLeanixFactSheetId)).toHaveLength(0)
    expect(Object.keys(mapping.relationKeyToLeanixRelationId)).toHaveLength(0)
  })

  it('entities without LeanIX external are omitted', () => {
    const manifest = minimalManifest({
      entities: {
        a: { canonicalId: 'a', external: {} },
        b: { canonicalId: 'b' },
      },
      relations: [
        {
          relationId: 'r1',
          sourceFqn: 'a',
          targetFqn: 'b',
          compositeKey: 'a|b|r1',
          external: {},
        },
      ],
    })
    const mapping = manifestToDrawioLeanixMapping(manifest)

    expect(Object.keys(mapping.likec4IdToLeanixFactSheetId)).toHaveLength(0)
    expect(Object.keys(mapping.relationKeyToLeanixRelationId)).toHaveLength(0)
  })

  it('one entity with LeanIX factSheetId is included', () => {
    const manifest = minimalManifest({
      entities: {
        cloud: {
          canonicalId: 'cloud',
          external: { leanix: { factSheetId: 'fs-123', externalId: 'fs-123' } },
        },
      },
    })
    const mapping = manifestToDrawioLeanixMapping(manifest)

    expect(mapping.likec4IdToLeanixFactSheetId['cloud']).toBe('fs-123')
    expect(Object.keys(mapping.relationKeyToLeanixRelationId)).toHaveLength(0)
  })

  it('entity with only externalId (no factSheetId) uses externalId', () => {
    const manifest = minimalManifest({
      entities: {
        node: { canonicalId: 'node', external: { leanix: { externalId: 'leanix-456' } } },
      },
    })
    const mapping = manifestToDrawioLeanixMapping(manifest)

    expect(mapping.likec4IdToLeanixFactSheetId['node']).toBe('leanix-456')
  })

  it('one relation with LeanIX relationId is included', () => {
    const manifest = minimalManifest({
      entities: {
        a: { canonicalId: 'a', external: { leanix: { factSheetId: 'fs-a' } } },
        b: { canonicalId: 'b', external: { leanix: { factSheetId: 'fs-b' } } },
      },
      relations: [
        {
          relationId: 'r1',
          sourceFqn: 'a',
          targetFqn: 'b',
          compositeKey: 'a|b|r1',
          external: { leanix: { relationId: 'rel-789' } },
        },
      ],
    })
    const mapping = manifestToDrawioLeanixMapping(manifest)

    expect(mapping.likec4IdToLeanixFactSheetId['a']).toBe('fs-a')
    expect(mapping.likec4IdToLeanixFactSheetId['b']).toBe('fs-b')
    expect(mapping.relationKeyToLeanixRelationId['a|b|r1']).toBe('rel-789')
  })

  it('relation without LeanIX external is omitted from relationKeyToLeanixRelationId', () => {
    const manifest = minimalManifest({
      entities: {
        a: { canonicalId: 'a', external: { leanix: { factSheetId: 'fs-a' } } },
        b: { canonicalId: 'b', external: { leanix: { factSheetId: 'fs-b' } } },
      },
      relations: [
        {
          relationId: 'r1',
          sourceFqn: 'a',
          targetFqn: 'b',
          compositeKey: 'a|b|r1',
          external: {},
        },
      ],
    })
    const mapping = manifestToDrawioLeanixMapping(manifest)

    expect(Object.keys(mapping.relationKeyToLeanixRelationId)).toHaveLength(0)
    expect(Object.keys(mapping.likec4IdToLeanixFactSheetId)).toHaveLength(2)
  })
})
