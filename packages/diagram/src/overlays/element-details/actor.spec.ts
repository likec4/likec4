import { scalar } from '@likec4/core'
import type { DiagramView } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createActor } from 'xstate'
import { elementDetailsLogic } from './actor'

const currentView = {
  _type: 'deployment',
  _stage: 'layouted',
  id: scalar.ViewId('production'),
  title: 'Production',
  description: null,
  tags: null,
  links: null,
  hash: 'production',
  autoLayout: { direction: 'TB' },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} satisfies DiagramView

describe('deployment details actor', () => {
  it('opens deployment details without starting a logical relationships browser', () => {
    const actor = createActor(elementDetailsLogic, {
      input: {
        subject: { type: 'deployment', deployment: scalar.DeploymentFqn('prod') },
        currentView,
      },
    }).start()

    expect(actor.getSnapshot().context.subject).toEqual({ type: 'deployment', deployment: 'prod' })
    expect(Object.keys(actor.getSnapshot().children)).toEqual([])
    actor.send({ type: 'close' })
    expect(actor.getSnapshot().status).toBe('done')
    actor.stop()
  })

  it('preserves the logical relationships browser for element details', () => {
    const actor = createActor(elementDetailsLogic, {
      input: {
        subject: { type: 'element', element: scalar.Fqn('cloud') },
        currentView,
      },
    }).start()

    expect(Object.keys(actor.getSnapshot().children)).toHaveLength(1)
    actor.send({ type: 'close' })
    expect(actor.getSnapshot().status).toBe('done')
    actor.stop()
  })

  it('starts and stops logical relationships when changing the subject', () => {
    const actor = createActor(elementDetailsLogic, {
      input: {
        subject: { type: 'deployment', deployment: scalar.DeploymentFqn('prod') },
        currentView,
      },
    }).start()

    actor.send({ type: 'change.subject', subject: { type: 'element', element: scalar.Fqn('cloud') } })
    expect(Object.keys(actor.getSnapshot().children)).toHaveLength(1)
    actor.send({ type: 'change.subject', subject: { type: 'deployment', deployment: scalar.DeploymentFqn('prod') } })
    expect(Object.keys(actor.getSnapshot().children)).toEqual([])
    actor.stop()
  })
})
