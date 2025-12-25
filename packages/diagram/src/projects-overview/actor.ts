import { type ProjectId, BBox, invariant, nonexhaustive, nonNullable } from '@likec4/core'
import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import {
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
} from '@xyflow/react'
import type { EdgeChange, NodeChange } from '@xyflow/system'
import { animate, mapValue, motionValue, styleEffect } from 'motion'
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
import type { ProjectsOverviewTypes, ProjectsOverviewXYFLowInstance, ProjectsOverviewXYStoreApi } from './_types'
import { layoutedProjectsViewToXYFlow } from './layouted-to-xyflow'
import { ProjectsOverviewViewportPersistence } from './persistence'

export type Input = {
  view: LayoutedProjectsView
}

export interface Context {
  initialized: {
    xydata: boolean
    xyflow: boolean
  }
  xystore: ProjectsOverviewXYStoreApi | null
  xyflow: ProjectsOverviewXYFLowInstance | null
  view: LayoutedProjectsView
  xynodes: ProjectsOverviewTypes.Node[]
  xyedges: ProjectsOverviewTypes.Edge[]
  navigateTo?: ProjectsOverviewTypes.Node
}

export type EmittedEvents = { type: 'select.project'; projectId: ProjectId; node: ProjectsOverviewTypes.Node }

/**
 * Converts a union of events to a union of events with a prefix.
 */
type EmitEach<T extends { type: string }> = {
  [Key in T['type']]: Simplify<{ type: `emit.${Key}` } & Omit<Extract<T, { type: Key }>, 'type'>>
}[T['type']]

export type Events =
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
      enqueue(cancelFitDiagram())
      enqueue(raiseFitDiagram())
      return
    }
    if (event.type === 'xyflow.click.pane') {
      enqueue(cancelFitDiagram())
      return
    }
    console.warn('Unknown event', event)
  })

const cancelFitDiagram = () => machine.cancel('fitDiagram')

const raiseFitDiagram = (params?: { delay?: number; duration?: number; bounds?: BBox }) => {
  const { delay = 30, ...rest } = params ?? {}
  return machine.raise(
    {
      type: 'xyflow.fitDiagram',
      ...rest,
    },
    {
      id: 'fitDiagram',
      delay,
    },
  )
}

export const fitDiagram = (params?: { duration?: number; bounds?: BBox }) =>
  machine.enqueueActions(({ context, event, enqueue }) => {
    enqueue(cancelFitDiagram())
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
      '32px',
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

const _projectOverviewLogic = machine.createMachine({
  id: 'projects-overview',
  context: ({ input }) => ({
    initialized: {
      xydata: false,
      xyflow: false,
    },
    xyflow: null,
    xystore: null,
    view: input.view,
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
        'xyflow.applyNodeChanges': {
          actions: xyflowApplyNodeChanges(),
        },
        'xyflow.applyEdgeChanges': {
          actions: xyflowApplyEdgeChanges(),
        },
        'xyflow.mouse.*': {
          actions: onMouseEnterOrLeave(),
        },
        'xyflow.click.node': {
          actions: assign({
            navigateTo: ({ event }) => event.node,
          }),
          target: 'navigate',
        },
        'xyflow.click.*': {
          actions: handleClick(),
        },
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
        cancelFitDiagram(),
        saveViewport(),
        assign({
          xynodes: ({ context }) =>
            context.xynodes.map(n => {
              if (n.id === context.navigateTo?.id) {
                return n
              }
              return {
                ...n,
                style: {
                  ...n.style,
                  opacity: .2,
                },
              }
            }),
          xyedges: [],
        }),
        ({ context: { navigateTo, xyflow, xystore }, self }) => {
          invariant(xyflow && navigateTo, 'Invalid state, xyflow is undefined')
          const { width, height, domNode } = nonNullable(xystore).getState()
          const nextZoom = clamp(
            Math.min(
              (width - 200) / (navigateTo.data.width),
              (height - 200) / (navigateTo.data.height),
            ),
            { min: MinZoom, max: 3 },
          )
          const next = {
            x: Math.round(-nextZoom * (navigateTo.position.x)) + 100,
            y: Math.round(-nextZoom * (navigateTo.position.y)) + 100,
          }
          const current = xyflow.getViewport()

          // const a = mix()
          const v = motionValue(0)

          const transform = mapValue(
            v,
            [0, 1],
            [
              `translate(${current.x}px, ${current.y}px) scale(${current.zoom})`,
              `translate(${next.x}px, ${next.y}px) scale(${nextZoom})`,
            ],
          )
          const opacity = mapValue(
            v,
            [0, 0.7, 1],
            [1, 0.6, 0],
          )

          styleEffect(domNode!.querySelector('.xyflow__viewport')!, {
            transform,
            opacity,
          })

          animate(v, 1, {
            ease: 'easeOut',
          }).finished.then(() => {
            self.send({
              type: 'emit.select.project',
              node: navigateTo,
              projectId: navigateTo.data.projectId,
            })
          })
        },
      ],
      on: {
        'emit.select.project': {
          actions: emit(({ event }) => ({
            ...event,
            type: 'select.project',
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
