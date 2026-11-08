import type { DiagramView, LayoutedDeploymentView } from '@likec4/core'
import { GroupElementKind, nonNullable, scalar } from '@likec4/core'
import { describe, expect, it, vi } from 'vitest'
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

const deploymentNode = nonNullable(view.nodes[0])

function createDiagram(enableElementDetails = true, currentView: DiagramView = view) {
  const events: OverlayActorEvent[] = []
  const { xynodes, xyedges } = diagramToXY({ view: currentView, currentViewId: undefined, where: null })
  const actor = createActor(
    diagramMachine.provide({
      actors: {
        mediaPrint: fromCallback(() => {}),
        hotkey: fromCallback(() => {}),
        overlays: fromCallback<OverlayActorEvent>(({ receive }) => {
          receive(event => events.push(event))
        }) as never,
      },
    }),
    {
      input: {
        view: currentView,
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
  actor.send({ type: 'update.view', view: currentView, source: 'external', xynodes, xyedges })

  return { actor, events, api: DiagramApi.withActor(actor), node: xynodes[0]! }
}

describe('node details API', () => {
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

  it('opens details when clicking a focused deployment node', () => {
    const { actor, events, node } = createDiagram()
    actor.send({
      type: 'update.features',
      features: { ...actor.getSnapshot().context.features, enableFocusMode: true },
    })
    actor.send({ type: 'focus.node', nodeId: deploymentNode.id })
    expect(actor.getSnapshot().matches({ ready: 'focused' })).toBe(true)
    actor.send({ type: 'xyflow.nodeClick', node })
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'deployment', deployment: 'prod' },
      currentView: view,
    })
    actor.stop()
  })

  it('sends the unified event and resolves a node ID to deployment details', () => {
    const { actor, api, events } = createDiagram()
    const send = vi.spyOn(api, 'send')
    api.openNodeDetails(scalar.NodeId('prod'))
    expect(send).toHaveBeenCalledWith({
      type: 'open.nodeDetails',
      target: 'prod',
      fromNode: undefined,
    })
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'deployment', deployment: 'prod' },
      currentView: view,
    })
    actor.stop()
  })

  it('keeps logical references distinct from deployment references with the same name', () => {
    const { actor, api, events } = createDiagram()
    api.openNodeDetails({ type: 'element', element: scalar.Fqn('prod') })
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'element', element: 'prod' },
      currentView: view,
    })
    actor.stop()
  })

  it('opens explicit deployment subjects outside the current view', () => {
    const { actor, api, events } = createDiagram()
    api.openNodeDetails({ type: 'deployment', deployment: scalar.DeploymentFqn('staging') })
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'deployment', deployment: 'staging' },
      currentView: view,
    })
    actor.stop()
  })

  it('opens explicit logical subjects outside the current view', () => {
    const { actor, api, events } = createDiagram()
    api.openNodeDetails({ type: 'element', element: scalar.Fqn('service') })
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'element', element: 'service' },
      currentView: view,
    })
    actor.stop()
  })

  it('prefers deployment details for a deployed instance with a logical reference', () => {
    const currentView = {
      ...view,
      nodes: [{
        ...deploymentNode,
        id: scalar.NodeId('instance-node'),
        deploymentRef: scalar.DeploymentFqn('prod.service'),
        modelRef: scalar.Fqn('service'),
      }],
    }
    const { actor, api, events } = createDiagram(true, currentView)
    api.openNodeDetails(scalar.NodeId('instance-node'))
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'deployment', deployment: 'prod.service' },
      currentView,
    })
    actor.stop()
  })

  it('resolves logical nodes using their model reference rather than their node ID', () => {
    const { deploymentRef: _, ...node } = deploymentNode
    const currentView = {
      ...view,
      _type: 'element',
      nodes: [{ ...node, modelRef: scalar.Fqn('service') }],
    } satisfies DiagramView
    const { actor, api, events } = createDiagram(true, currentView)
    api.openNodeDetails(node.id)
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'element', element: 'service' },
      currentView,
    })
    actor.stop()
  })

  it('resolves compound deployment nodes', () => {
    const childId = scalar.NodeId('prod.service')
    const currentView = {
      ...view,
      nodes: [
        { ...deploymentNode, children: [childId] },
        {
          ...deploymentNode,
          id: childId,
          parent: deploymentNode.id,
          deploymentRef: scalar.DeploymentFqn('prod.service'),
        },
      ],
    }
    const { actor, api, events, node } = createDiagram(true, currentView)
    expect(node.type).toBe('compound-deployment')
    api.openNodeDetails(deploymentNode.id)
    expect(events).toContainEqual({
      type: 'open.elementDetails',
      subject: { type: 'deployment', deployment: 'prod' },
      currentView,
    })
    actor.stop()
  })

  it('warns without opening details for unknown nodes or groups without references', () => {
    const { deploymentRef: _, ...node } = deploymentNode
    const currentView = {
      ...view,
      nodes: [{ ...node, kind: GroupElementKind }],
    }
    const { actor, api, events } = createDiagram(true, currentView)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      api.openNodeDetails(scalar.NodeId('missing'))
      api.openNodeDetails(node.id)
      expect(warn).toHaveBeenCalledWith('No model or deployment reference for node', 'missing')
      expect(warn).toHaveBeenCalledWith('No model or deployment reference for node', node.id)
      expect(events).not.toContainEqual(expect.objectContaining({ type: 'open.elementDetails' }))
    } finally {
      warn.mockRestore()
      actor.stop()
    }
  })

  it('respects the details feature flag', () => {
    const { actor, api, events } = createDiagram(false)
    api.openNodeDetails(scalar.NodeId('prod'))
    api.openNodeDetails({ type: 'element', element: scalar.Fqn('service') })
    api.openNodeDetails({ type: 'deployment', deployment: scalar.DeploymentFqn('prod') })
    expect(events).not.toContainEqual(expect.objectContaining({ type: 'open.elementDetails' }))
    actor.stop()
  })
})
