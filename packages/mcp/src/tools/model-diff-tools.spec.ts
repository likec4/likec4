import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured } from '../__tests__/test-utils'

const source = `
  specification {
    element system
    element component
  }
  model {
    cloud = system 'Cloud' {
      api = component 'API'
      legacy = component 'Legacy'
      audit = component 'Audit'
    }
    cloud.api -> cloud.legacy 'calls'
    cloud.legacy -> cloud.audit 'logs'
  }
  views {
    view cloud of cloud {
      include *
    }
  }
  diff rfc 'Replace legacy' {
    remove {
      cloud.legacy
    }
    add {
      extend cloud {
        next = component 'Next'
      }
      cloud.api -> cloud.next 'calls'
    }
  }
`

describe('removal-impact tool', () => {
  it('reports what the removal takes with it', async () => {
    await using pair = await createMCPTestPair(source)
    const result = await pair.client.callTool({
      name: 'removal-impact',
      arguments: { id: 'cloud.legacy', project: 'default' },
    })
    const data = structured(result)
    expect(data['elements']).toEqual(['cloud.legacy'])
    expect(data['relationships']).toBe(2)
    // cloud.api loses its only relationship (the diff is not applied)
    expect([...(data['orphans'] as string[])].sort()).toEqual(['cloud.api', 'cloud.audit'])
    expect(data['affectedViews']).toEqual(['cloud'])
    const references = data['references'] as Array<{ kind: string; resolution: string }>
    expect(references.map(r => `${r.kind}:${r.resolution}`)).toEqual(expect.arrayContaining([
      'relation:removed',
      'diff:manual',
    ]))
  })
})

describe('list-diffs tool', () => {
  it('lists diffs with changed views', async () => {
    await using pair = await createMCPTestPair(source)
    const result = await pair.client.callTool({
      name: 'list-diffs',
      arguments: { project: 'default' },
    })
    const diffs = structured(result)['diffs'] as Array<Record<string, unknown>>
    expect(diffs).toHaveLength(1)
    expect(diffs[0]).toMatchObject({
      id: 'rfc',
      title: 'Replace legacy',
      added: { elements: 1, relations: 1 },
      removed: { elements: 1, relations: 0 },
      views: [{ id: 'cloud' }],
    })
  })
})
