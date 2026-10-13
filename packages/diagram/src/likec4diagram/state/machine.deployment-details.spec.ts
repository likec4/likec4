import type { LayoutedDeploymentView } from '@likec4/core'
import { scalar } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import type { OverlayActorEvent } from '../../overlays/overlaysActor'
import { diagramToXY } from '../xyflow-diagram/diagram-view'
import { DiagramApi } from './diagram-api'
import { diagramMachine } from './machine'

const view = {
  _type: 'deployment',
  _stage: 'layouted',
  id: scalar.ViewId('production'),
  title: 'Production',
  description: null,
  tags: null,
  links: null,
  hash: 'production',
  autoLayout: { direction: 'TB' },
  nodes: [{
    id: scalar.NodeId('prod'),
    deploymentRef: scalar.DeploymentFqn('prod'),
    kind: 'environment',
    title: 'Production',
    description: { txt: 'Production deployment' },
    technology: null,
    color: 'primary',
    shape: 'rectangle',
    style: {},
    tags: [],
    parent: null,
    children: [],
    inEdges: [],
    outEdges: [],
    level: 0,
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    labelBBox: { x: 0, y: 0, width: 100, height: 24 },
  }],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} satisfies LayoutedDeploymentView

function createDiagram(enableElementDetails = true) {
  const events: OverlayActorEvent[] = []
  const { xynodes, xyedges } = diagramToXY({ view, currentViewId: undefined, where: null })
  const actor = createActor(
    diagramMachine.provide({
      actors: {
        mediaPrint: fromCallback(() => {}),
        overlays: fromCallback<OverlayActorEvent>(({ receive }) => {
          receive(event => events.push(event))
        }) as never,
      },
    }),
    {
      input: {
        view,
        xystore: {
          getState: () => ({
            width: 800,
            height: 600,
            transform: [0, 0, 1],
            nodeLookup: new Map(),
          }),
          setState: () => {},
          subscribe: () => () => {},
        } as unknown as XYStoreApi,
        zoomable: true,
        pannable: true,
        nodesDraggable: false,
        nodesSelectable: false,
        fitViewPadding: {},
        where: null,
        features: { ...DefaultFeatures, enableElementDetails, enableReadOnly: true },
      },
    },
  ).start()
  actor.send({
    type: 'xyflow.init',
    instance: { getViewport: () => ({ x: 0, y: 0, zoom: 1 }) } as XYFlowInstance,
  })
  actor.send({ type: 'update.view', view, source: 'external', xynodes, xyedges })

  return { actor, events, api: DiagramApi.withActor({ current: actor }), node: xynodes[0]! }
}

describe('deployment details API', () => {
  it('opens details on repeated clicks on a deployment node without a logical reference', () => {
    const { actor, events, node } = createDiagram()
    actor.send({ type: 'xyflow.nodeClick', node })
    actor.send({ type: 'xyflow.nodeClick', node })

    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'deployment', deployment: 'prod' },
      currentView: view,
    })
    actor.stop()
  })

  it('routes deployment references to the details overlay', () => {
    const { actor, api, events } = createDiagram()
    api.openDeploymentDetails(scalar.DeploymentFqn('prod'))
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'deployment', deployment: 'prod' },
      currentView: view,
    })
    actor.stop()
  })

  it('keeps logical references distinct from deployment references with the same name', () => {
    const { actor, api, events } = createDiagram()
    api.openElementDetails(scalar.Fqn('prod'))
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'element', element: 'prod' },
      currentView: view,
    })
    actor.stop()
  })

  it('respects the details feature flag', () => {
    const { actor, api, events } = createDiagram(false)
    api.openDeploymentDetails(scalar.DeploymentFqn('prod'))
    expect(events).not.toContainEqual(expect.objectContaining({ type: 'open.elementDetails' }))
    actor.stop()
  })
})
