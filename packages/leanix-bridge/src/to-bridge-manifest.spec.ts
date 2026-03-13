import { describe, expect, it } from 'vitest'
import { BRIDGE_VERSION } from './contracts'
import { toBridgeManifest } from './to-bridge-manifest'
import { createFixtureModel } from './fixture-model'

describe('toBridgeManifest', () => {
  it('produces manifest with canonical IDs for entities, views, relations', () => {
    const model = createFixtureModel()
    const manifest = toBridgeManifest(model, {
      mappingProfile: 'test',
      generatedAt: '2025-01-15T12:00:00.000Z',
    })

    expect(manifest.manifestVersion).toBe('1.0')
    expect(manifest.generatedAt).toBe('2025-01-15T12:00:00.000Z')
    expect(manifest.bridgeVersion).toBe(BRIDGE_VERSION)
    expect(manifest.mappingProfile).toBe('test')
    expect(manifest.projectId).toBe('test-project')

    expect(Object.keys(manifest.entities)).toHaveLength(3)
    expect(manifest.entities['cloud'].canonicalId).toBe('cloud')
    expect(manifest.entities['cloud.backend.api'].canonicalId).toBe('cloud.backend.api')

    expect(Object.keys(manifest.views)).toHaveLength(2)
    expect(manifest.views['index'].viewId).toBe('index')

    expect(manifest.relations).toHaveLength(2)
    expect(manifest.relations[0].compositeKey).toBe('cloud|cloud.backend|r1')
    expect(manifest.relations[1].sourceFqn).toBe('cloud.backend')
    expect(manifest.relations[1].targetFqn).toBe('cloud.backend.api')
  })

  it('empty model produces empty entities/views/relations', () => {
    const model = createFixtureModel({
      elements: [],
      relations: [],
      views: [],
    })
    const manifest = toBridgeManifest(model)

    expect(Object.keys(manifest.entities)).toHaveLength(0)
    expect(Object.keys(manifest.views)).toHaveLength(0)
    expect(manifest.relations).toHaveLength(0)
  })

  it('single element produces one entity and empty relations', () => {
    const model = createFixtureModel({
      elements: [{ id: 'only', kind: 'system', title: 'Only', tags: [], metadata: {} }],
      relations: [],
      views: [{ id: 'index' }],
    })
    const manifest = toBridgeManifest(model)

    expect(Object.keys(manifest.entities)).toHaveLength(1)
    expect(manifest.entities['only'].canonicalId).toBe('only')
    expect(Object.keys(manifest.views)).toHaveLength(1)
    expect(manifest.relations).toHaveLength(0)
  })

  it('single relation produces one relation with correct compositeKey', () => {
    const model = createFixtureModel({
      elements: [
        { id: 'a', kind: 'system', title: 'A', tags: [], metadata: {} },
        { id: 'b', kind: 'system', title: 'B', tags: [], metadata: {} },
      ],
      relations: [{ id: 'r1', source: 'a', target: 'b', kind: 'depends', title: null }],
      views: [],
    })
    const manifest = toBridgeManifest(model)

    expect(manifest.relations).toHaveLength(1)
    expect(manifest.relations[0].compositeKey).toBe('a|b|r1')
    expect(manifest.relations[0].sourceFqn).toBe('a')
    expect(manifest.relations[0].targetFqn).toBe('b')
  })
})
