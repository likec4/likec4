import { describe, expect, it } from 'vitest'
import { isBridgeManifest, isLeanixInventorySnapshot } from './validate'

const validManifest = {
  manifestVersion: '1.0',
  generatedAt: '2025-01-15T12:00:00.000Z',
  bridgeVersion: '0.1.0',
  mappingProfile: 'default',
  projectId: 'test',
  entities: {
    cloud: { canonicalId: 'cloud', external: {} },
    'cloud.api': { canonicalId: 'cloud.api', external: {} },
  },
  views: { index: { viewId: 'index', external: {} } },
  relations: [
    {
      relationId: 'r1',
      sourceFqn: 'cloud',
      targetFqn: 'cloud.api',
      compositeKey: 'cloud|cloud.api|r1',
      external: {},
    },
  ],
}

const validSnapshot = {
  generatedAt: '2025-01-15T12:00:00.000Z',
  factSheets: [
    { id: 'fs-1', name: 'Cloud', type: 'Application' },
    { id: 'fs-2', name: 'API', type: 'ITComponent', likec4Id: 'cloud.api' },
  ],
  relations: [
    { sourceFactSheetId: 'fs-1', targetFactSheetId: 'fs-2', type: 'RELATES_TO' },
  ],
}

describe('isBridgeManifest', () => {
  it('returns true for valid manifest', () => {
    expect(isBridgeManifest(validManifest)).toBe(true)
  })

  it('returns false for null or non-object', () => {
    expect(isBridgeManifest(null)).toBe(false)
    expect(isBridgeManifest(undefined)).toBe(false)
    expect(isBridgeManifest('')).toBe(false)
    expect(isBridgeManifest([])).toBe(false)
  })

  it('returns false when entities is an array', () => {
    expect(isBridgeManifest({ ...validManifest, entities: [] })).toBe(false)
    expect(
      isBridgeManifest({ ...validManifest, entities: [validManifest.entities['cloud']] }),
    ).toBe(false)
  })

  it('returns false when entity value lacks canonicalId', () => {
    const badEntities = { cloud: { external: {} } }
    expect(isBridgeManifest({ ...validManifest, entities: badEntities })).toBe(false)
  })

  it('returns false when views is an array', () => {
    expect(isBridgeManifest({ ...validManifest, views: [] })).toBe(false)
  })

  it('returns false when view value lacks viewId', () => {
    const badViews = { index: { external: {} } }
    expect(isBridgeManifest({ ...validManifest, views: badViews })).toBe(false)
  })

  it('returns false when relations item lacks required fields', () => {
    expect(
      isBridgeManifest({
        ...validManifest,
        relations: [{ relationId: 'r1', sourceFqn: 'cloud' }],
      }),
    ).toBe(false)
    expect(
      isBridgeManifest({
        ...validManifest,
        relations: [{ relationId: 'r1', sourceFqn: 'cloud', targetFqn: 'cloud.api' }],
      }),
    ).toBe(false)
  })

  it('returns false when required top-level string fields are missing or wrong type', () => {
    expect(isBridgeManifest({ ...validManifest, manifestVersion: 1 })).toBe(false)
    expect(isBridgeManifest({ ...validManifest, projectId: null })).toBe(false)
  })
})

describe('isLeanixInventorySnapshot', () => {
  it('returns true for valid snapshot', () => {
    expect(isLeanixInventorySnapshot(validSnapshot)).toBe(true)
  })

  it('returns true for snapshot with optional workspaceId', () => {
    expect(isLeanixInventorySnapshot({ ...validSnapshot, workspaceId: 'ws-1' })).toBe(true)
  })

  it('returns false for null or non-object', () => {
    expect(isLeanixInventorySnapshot(null)).toBe(false)
    expect(isLeanixInventorySnapshot(undefined)).toBe(false)
    expect(isLeanixInventorySnapshot([])).toBe(false)
  })

  it('returns false when factSheets is not an array', () => {
    expect(isLeanixInventorySnapshot({ ...validSnapshot, factSheets: {} })).toBe(false)
  })

  it('returns false when fact sheet item lacks id, name or type', () => {
    expect(
      isLeanixInventorySnapshot({
        ...validSnapshot,
        factSheets: [{ name: 'Cloud', type: 'Application' }],
      }),
    ).toBe(false)
    expect(
      isLeanixInventorySnapshot({
        ...validSnapshot,
        factSheets: [{ id: 'fs-1', type: 'Application' }],
      }),
    ).toBe(false)
  })

  it('returns false when relations item lacks sourceFactSheetId, targetFactSheetId or type', () => {
    expect(
      isLeanixInventorySnapshot({
        ...validSnapshot,
        relations: [{ sourceFactSheetId: 'fs-1', targetFactSheetId: 'fs-2' }],
      }),
    ).toBe(false)
  })

  it('returns false when generatedAt is missing or not string', () => {
    expect(isLeanixInventorySnapshot({ ...validSnapshot, generatedAt: 123 })).toBe(false)
  })
})
