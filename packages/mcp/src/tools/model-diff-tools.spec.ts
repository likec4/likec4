import { describe } from 'vitest'
import { createMCPTest } from '../__tests__/test-utils'

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

const it = createMCPTest(source)

describe('removal-impact tool', () => {
  it('reports what the removal takes with it', async ({ callTool, expect }) => {
    const data = await callTool.structured('removal-impact', {
      id: 'cloud.legacy',
      project: 'default',
    })
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
  it('lists diffs with changed views', async ({ callTool, expect }) => {
    const diffs = (await callTool.structured('list-diffs', { project: 'default' }))['diffs'] as Array<
      Record<string, unknown>
    >
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
