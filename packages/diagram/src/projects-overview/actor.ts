import { type NodeId, type ProjectId, BBox, invariant, nonexhaustive, nonNullable } from '@likec4/core'
import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import {
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
} from '@xyflow/react'
import type { EdgeChange, NodeChange } from '@xyflow/system'
import {
  animate,
  mapValue,
  motionValue,
  stagger,
  styleEffect,
} from 'motion'
import type { MouseEvent } from 'react'
import { clamp } from 'remeda'
import type { Simplify } from 'type-fest'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assertEvent,
  setup,
} from 'xstate'
import { assign, emit } from 'xstate/actions'
import { MinZoom } from '../base'
import { Base } from '../base/Base'
import type { ViewPadding } from '../LikeC4Diagram.props'
import type { ProjectsOverviewTypes, ProjectsOverviewXYFLowInstance, ProjectsOverviewXYStoreApi } from './_types'
import { layoutedProjectsViewToXYFlow } from './layouted-to-xyflow'
import { ProjectsOverviewViewportPersistence } from './persistence'

export type Input = {
  view: LayoutedProjectsView
  fitViewPadding: ViewPadding
}

export interface Context {
  initialized: {
    xydata: boolean
    xyflow: boolean
  }
  xystore: ProjectsOverviewXYStoreApi | null
  xyflow: ProjectsOverviewXYFLowInstance | null
  view: LayoutedProjectsView
  fitViewPadding: ViewPadding
  xynodes: ProjectsOverviewTypes.Node[]
  xyedges: ProjectsOverviewTypes.Edge[]
  navigateTo?: ProjectsOverviewTypes.Node
}

export type EmittedEvents = { type: 'navigate.to'; projectId: ProjectId }

/**
 * Converts a union of events to a union of events with a prefix.
 */
type EmitEach<T extends { type: string }> = {
  [Key in T['type']]: Simplify<{ type: `emit.${Key}` } & Omit<Extract<T, { type: Key }>, 'type'>>
}[T['type']]

export type Events =
  | { type: 'navigate.to'; projectId: ProjectId; fromNode: NodeId }
  | { type: 'xyflow.init'; xyflow: ProjectsOverviewXYFLowInstance; xystore: ProjectsOverviewXYStoreApi }
  | { type: 'xyflow.click.node'; node: ProjectsOverviewTypes.Node }
  | { type: 'xyflow.click.edge'; edge: ProjectsOverviewTypes.Edge }
  | { type: 'xyflow.click.pane' }
  | { type: 'xyflow.click.double' }
  | { type: 'xyflow.mouse.enter.node'; node: ProjectsOverviewTypes.Node }
  | { type: 'xyflow.mouse.leave.node'; node: ProjectsOverviewTypes.Node }
  | { type: 'xyflow.mouse.enter.edge'; edge: ProjectsOverviewTypes.Edge; event: MouseEvent }
  | { type: 'xyflow.mouse.leave.edge'; edge: ProjectsOverviewTypes.Edge; event: MouseEvent }
  | { type: 'xyflow.applyNodeChanges'; changes: NodeChange<ProjectsOverviewTypes.Node>[] }
  | { type: 'xyflow.applyEdgeChanges'; changes: EdgeChange<ProjectsOverviewTypes.Edge>[] }
  | { type: 'xyflow.fitDiagram'; bounds?: BBox; duration?: number }
  | { type: 'update.view'; view: LayoutedProjectsView }
  | EmitEach<EmittedEvents>
  | { type: 'close' }

type Tags = 'active'

const machine = setup({
  types: {
    context: {} as Context,
    tags: '' as Tags,
    input: {} as Input,
    events: {} as Events,
    emitted: {} as EmittedEvents,
  },
  guards: {
    isReady: ({ context }) =>
      context.initialized.xydata
      && context.initialized.xyflow && !!context.xystore && !!context.xyflow,
    'click: selected node': ({ event }) => {
      return event.type === 'xyflow.click.node' && event.node.selected === true
    },
  },
})

// Extracted actions

const updateView = () =>
  machine.assign(({ event }) => {
    assertEvent(event, 'update.view')
    const { xynodes, xyedges } = layoutedProjectsViewToXYFlow(event.view)
    return {
      view: event.view,
      xynodes,
      xyedges,
    }
  })

const xyflowApplyNodeChanges = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'xyflow.applyNodeChanges')
    return {
      xynodes: applyNodeChanges(event.changes, context.xynodes),
    }
  })

const xyflowApplyEdgeChanges = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'xyflow.applyEdgeChanges')
    return {
      xyedges: applyEdgeChanges(event.changes, context.xyedges),
    }
  })

// Mouse event handlers with parameters
export const onMouseEnterOrLeave = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, [
      'xyflow.mouse.enter.edge',
      'xyflow.mouse.leave.edge',
      'xyflow.mouse.enter.node',
      'xyflow.mouse.leave.node',
    ])
    const isEnter = event.type.startsWith('xyflow.mouse.enter')

    switch (event.type) {
      case 'xyflow.mouse.enter.edge':
      case 'xyflow.mouse.leave.edge': {
        const edgeId = event.edge.id
        return {
          xyedges: context.xyedges.map(e => {
            if (e.id === edgeId) {
              return Base.setHovered(e, isEnter)
            }
            return e
          }),
        }
      }
      case 'xyflow.mouse.enter.node':
      case 'xyflow.mouse.leave.node': {
        const nodeId = event.node.id
        return {
          xynodes: context.xynodes.map(n => {
            if (n.id === nodeId) {
              return Base.setHovered(n, isEnter)
            }
            return n
          }),
        }
      }
      default:
        nonexhaustive(event)
    }
  })

const saveViewport = () =>
  machine.createAction(({ context }) => {
    const xyflow = context.xyflow
    if (xyflow) {
      ProjectsOverviewViewportPersistence.write(xyflow.getViewport())
    }
  })

const handleClick = () =>
  machine.enqueueActions(({ event, enqueue }) => {
    if (event.type === 'xyflow.click.double') {
      enqueue(fitDiagram())
      return
    }
  })

export const fitDiagram = (params?: { duration?: number; bounds?: BBox }) =>
  machine.enqueueActions(({ context, event }) => {
    let bounds = context.view.bounds, duration: number | undefined
    if (params) {
      bounds = params.bounds ?? context.view.bounds
      duration = params.duration
    } else if (event.type === 'xyflow.fitDiagram') {
      bounds = event.bounds ?? context.view.bounds
      duration = event.duration
    }
    // Default values
    duration ??= 450

    const { width, height, panZoom, transform } = nonNullable(context.xystore).getState()

    const maxZoom = Math.max(1, transform[2])
    const viewport = getViewportForBounds(
      bounds,
      width,
      height,
      MinZoom,
      maxZoom,
      context.fitViewPadding,
    )
    viewport.x = Math.round(viewport.x)
    viewport.y = Math.round(viewport.y)

    const animationProps = duration > 0 ? { duration, interpolate: 'smooth' as const } : undefined

    panZoom?.setViewport(viewport, animationProps).catch((err) => {
      console.error('Error during fitDiagram panZoom setViewport', { err })
    })
    ProjectsOverviewViewportPersistence.write(null)
  })

export const restoreViewport = () =>
  machine.enqueueActions(({ context, enqueue }) => {
    const viewport = ProjectsOverviewViewportPersistence.read()
    if (viewport) {
      const xyflow = nonNullable(context.xyflow)
      xyflow.setViewport(viewport, {
        duration: 0,
      })
      return
    }
    enqueue(fitDiagram({ duration: 0 }))
  })

const dispose = () =>
  machine.assign({
    xyflow: null,
    xystore: null,
    initialized: {
      xyflow: false,
      xydata: false,
    },
    xyedges: [],
    xynodes: [],
  })

const assignNavigateTo = () =>
  machine.assign(({ event, context }) => {
    let navigateTo
    switch (event.type) {
      case 'xyflow.click.node': {
        navigateTo = event.node
        break
      }
      case 'navigate.to': {
        navigateTo = nonNullable(context.xynodes.find(n => n.id === event.fromNode), `Node ${event.fromNode} not found`)
        break
      }
      default: {
        console.warn(`Unexpected event ${event.type} in assignNavigateTo`)
        return {}
      }
    }
    return {
      navigateTo,
    }
  })

const _projectOverviewLogic = machine.createMachine({
  id: 'projects-overview',
  context: ({ input }) => ({
    ...input,
    initialized: {
      xydata: false,
      xyflow: false,
    },
    xyflow: null,
    xystore: null,
    xynodes: [],
    xyedges: [],
  }),
  initial: 'init',
  on: {
    'close': {
      target: '.closed',
    },
  },
  states: {
    init: {
      on: {
        'update.view': {
          actions: [
            updateView(),
            assign(({ context }) => ({
              initialized: {
                ...context.initialized,
                xydata: true,
              },
            })),
          ],
          target: 'isReady',
        },
        'xyflow.init': {
          actions: [
            assign(({ context, event }) => ({
              initialized: {
                ...context.initialized,
                xyflow: true,
              },
              xyflow: event.xyflow,
              xystore: event.xystore,
            })),
          ],
          target: 'isReady',
        },
      },
    },
    isReady: {
      always: [{
        guard: 'isReady',
        target: 'active',
      }, {
        target: 'init',
      }],
    },
    active: {
      tags: 'active',
      entry: [
        restoreViewport(),
      ],
      on: {
        'navigate.to': {
          actions: assignNavigateTo(),
          target: 'navigate',
        },
        'xyflow.applyNodeChanges': {
          actions: xyflowApplyNodeChanges(),
        },
        'xyflow.applyEdgeChanges': {
          actions: xyflowApplyEdgeChanges(),
        },
        'xyflow.mouse.*': {
          actions: onMouseEnterOrLeave(),
        },
        'xyflow.click.*': [
          {
            guard: 'click: selected node',
            actions: assignNavigateTo(),
            target: 'navigate',
          },
          {
            actions: handleClick(),
          },
        ],
        'xyflow.fitDiagram': {
          actions: fitDiagram(),
        },
        'update.view': {
          actions: updateView(),
        },
      },
    },
    navigate: {
      tags: 'active',
      entry: [
        saveViewport(),
        assign({
          xyedges: [],
        }),
        ({ context: { navigateTo, xyflow, xystore }, self }) => {
          invariant(xyflow && navigateTo, 'Invalid state, xyflow is undefined')
          const { width, domNode } = nonNullable(xystore).getState()
          const nextZoom = clamp(
            Math.min(
              (width * 7 / 9) / (navigateTo.data.width),
              // (height - 200) / (navigateTo.data.height),
            ),
            { min: MinZoom, max: 2.5 },
          )
          const next = {
            x: Math.round(
              -nextZoom * (navigateTo.position.x) + (width - nextZoom * navigateTo.data.width) / 2,
            ),
            y: Math.round(-nextZoom * (navigateTo.position.y)) + 50,
          }
          const current = xyflow.getViewport()

          const otherNodes = domNode!.querySelectorAll(
            `.react-flow__node-project:not([data-id="${navigateTo.id}"]) > *`,
          )

          const otherNodesAnimation = animate(otherNodes, {
            opacity: 0,
            scale: .9,
          }, {
            visualDuration: .25,
            delay: stagger(.08, { from: 'center' }),
          })

          // Target node
          const v = motionValue(1)

          const transform = mapValue(
            v,
            [1, 0],
            [
              `translate(${current.x}px, ${current.y}px) scale(${current.zoom})`,
              `translate(${next.x}px, ${next.y}px) scale(${nextZoom})`,
            ],
          )

          const cancelViewportAnimation = styleEffect(
            domNode!.querySelector('.xyflow__viewport')!,
            { transform },
          )
          const cancelOpacityAnimation = styleEffect(
            domNode!.querySelector(`.react-flow__node-project:is([data-id="${navigateTo.id}"]) > *`)!,
            { opacity: v },
          )

          const targetAnimation = animate(
            v,
            0,
            {
              delay: otherNodes.length > 3 ? .25 : 0,
              type: 'spring',
              stiffness: 350,
              damping: 40,
              mass: 1.5,
              visualDuration: .55,
            },
          )

          Promise.race([
            targetAnimation.finished,
            sleep(750),
          ]).then(() => {
            cancelViewportAnimation()
            cancelOpacityAnimation()
            targetAnimation.stop()
            otherNodesAnimation.stop()
            self.send({
              type: 'emit.navigate.to',
              projectId: navigateTo.data.projectId,
            })
          })
        },
      ],
      on: {
        'emit.navigate.to': {
          actions: emit(({ event }) => ({
            ...event,
            type: 'navigate.to',
          })),
        },
      },
    },
    closed: {
      id: 'closed',
      type: 'final',
      entry: dispose(),
    },
  },
})

export interface ProjectsOverviewLogic extends
  StateMachine<
    Context,
    Events,
    {},
    any,
    any,
    any,
    any,
    any,
    Tags,
    Input,
    any,
    EmittedEvents,
    any,
    any
  >
{
}

export const projectOverviewLogic: ProjectsOverviewLogic = _projectOverviewLogic as any

export type ProjectsOverviewSnapshot = SnapshotFrom<ProjectsOverviewLogic>
export interface ProjectsOverviewActorRef extends ActorRef<ProjectsOverviewSnapshot, Events, EmittedEvents> {
}

export type {
  Input as ProjectsOverviewInput,
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
