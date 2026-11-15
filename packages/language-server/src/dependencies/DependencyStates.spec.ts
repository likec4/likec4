import type { ProjectId } from '@likec4/core/types'
import { describe } from 'vitest'
import { test as it } from '../test'
import type { TestServices } from '../test/testServices'
import type { DependencyState } from './types'

const source = { git: 'https://github.com/my-org/billing.git', ref: 'v1' }

const notInstalled = (consumer: string, name: string): DependencyState => ({
  status: 'not-installed',
  consumer: consumer as ProjectId,
  name,
  source,
})

async function initialized(t: TestServices) {
  await t.initialize()
  return t.services.shared.dependencies.States
}

describe('DependencyStates', () => {
  it('is empty until the first update', async ({ create, expect }) => {
    const states = await initialized(create())
    expect(states.all()).toEqual([])
    expect(states.get('a' as ProjectId, 'billing')).toBeUndefined()
  })

  it('answers by consumer and name, and fires only for consumers whose states changed', async ({ create, expect }) => {
    const states = await initialized(create())
    const events = [] as unknown[]
    states.onDidChange(e => events.push(e))

    expect(states.update([notInstalled('a', 'billing'), notInstalled('b', 'billing')])).toEqual(['a', 'b'])
    expect(states.get('a' as ProjectId, 'billing')?.status).toBe('not-installed')
    expect(states.all('b' as ProjectId)).toHaveLength(1)
    expect(states.all()).toHaveLength(2)
    expect(events).toEqual([{ consumers: ['a', 'b'] }])

    // same states (new objects): no event
    expect(states.update([notInstalled('a', 'billing'), notInstalled('b', 'billing')])).toEqual([])
    expect(events).toHaveLength(1)

    // b changes its status, a is removed
    states.update([{ ...notInstalled('b', 'billing'), status: 'unsupported' }])
    expect(events.at(-1)).toEqual({ consumers: ['a', 'b'] })
    expect(states.get('a' as ProjectId, 'billing')).toBeUndefined()
  })

  it('defers the event of updates without notification to the next update', async ({ create, expect }) => {
    const states = await initialized(create())
    const events = [] as unknown[]
    states.onDidChange(e => events.push(e))

    states.update([notInstalled('a', 'billing')], { notify: false })
    // the state is visible immediately
    expect(states.get('a' as ProjectId, 'billing')?.status).toBe('not-installed')
    expect(events).toEqual([])

    // nothing changed by this update, but the deferred change is fired
    states.update([notInstalled('a', 'billing')])
    expect(events).toEqual([{ consumers: ['a'] }])
    states.update([notInstalled('a', 'billing')])
    expect(events).toHaveLength(1)
  })
})
