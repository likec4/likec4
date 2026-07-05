import { invariant, nonNullable } from '@likec4/core'
import {
  type BBox,
  type DiagramEdge,
  type DiagramNode,
  type LayoutedDynamicView,
  type StepPath,
  type ViewId,
  type XYPoint,
  DynamicViewFlow,
  dynamicViewFlow,
  flowGuards,
  flowHelpers,
  hasProp,
  NodeId,
} from '@likec4/core/types'
import { findLast, flatMap, isArray } from 'remeda'
import type { SetNonNullable, SetRequired, Writable } from 'type-fest'
import type { Types } from '../types'
import {
  SeqParallelAreaColor,
  SeqZIndex,
} from './const'
import { calcSequenceLayout } from './sequence-view'

type Ctx = {
  view: Omit<LayoutedDynamicView, 'sequenceLayout' | 'flow'>
  flow: DynamicViewFlow | undefined
  layout: LayoutedDynamicView.Sequence.Layout
  subflowArea: (id: StepPath) => LayoutedDynamicView.Sequence.SubflowArea | undefined
}

/**
 * Converts a sequence layout to XY flow nodes and edges.
 * @param view The next dynamic view which contains the sequence layout.
 * @param currentViewId The ID of the current view (optional, used to exclude navigation to the current view)
 */
export function sequenceLayoutToXY(
  view: LayoutedDynamicView,
  currentViewId: ViewId | undefined,
): {
  xynodes: Array<Types.SequenceActorNode | Types.SequenceParallelArea | Types.SequenceSubflowArea | Types.ViewGroupNode>
  xyedges: Array<Types.SequenceStepEdge>
  layout: LayoutedDynamicView.Sequence.Layout
} {
  const flow = hasProp(view, 'flow') ? dynamicViewFlow(view) : undefined

  // We calculate sequence layout here only for development purposes
  // In production, the layout will be already calculated and stored in the view
  const layout = flow ? calcSequenceLayout(view, flow) : view.sequenceLayout

  const ctx: Ctx = {
    view,
    flow,
    layout,
    subflowArea: (id: StepPath) => layout.subflows.find((area) => area.id === id),
  }
  const { actors, steps, compounds, parallelAreas, subflows, bounds } = ctx.layout

  const xynodes = [] as Array<
    Types.SequenceActorNode | Types.SequenceParallelArea | Types.SequenceSubflowArea | Types.ViewGroupNode
  >
  const xyedges = [] as Array<Types.SequenceStepEdge>

  const getNode = (id: NodeId): DiagramNode => {
    return nonNullable(view.nodes.find((n) => n.id === id))
  }

  for (const compound of compounds) {
    xynodes.push(toCompoundArea(compound, getNode(compound.origin), view))
  }

  // In manual snapshots, subflows are emtpy
  if (isArray(subflows) && hasProp(ctx, 'flow')) {
    xynodes.push(...createSubflowNodes(ctx))
  } else {
    for (const parallelArea of parallelAreas) {
      xynodes.push(toSeqParallelArea(parallelArea, view))
    }
  }

  //

  for (const actor of actors) {
    xynodes.push(toSeqActorNode(actor, getNode(actor.id), bounds, view))
  }

  let stepnum = 1
  for (const step of steps) {
    const edge = view.edges.find((e) => e.id === step.id)
    if (!edge) {
      console.error(`Step Edge "${step.id}" not found`)
      continue
    }
    xyedges.push(toSeqStepEdge(step, edge, currentViewId ?? view.id, stepnum++, ctx))
  }

  return {
    xynodes,
    xyedges,
    layout,
  }
}

/**
 * Shows a compound as a view group node
 */
function toCompoundArea(
  { id, x, y, width, height, depth }: LayoutedDynamicView.Sequence.Compound,
  node: DiagramNode,
  view: LayoutedDynamicView,
): Types.ViewGroupNode {
  return {
    id,
    type: 'view-group',
    data: {
      id: node.id,
      title: node.title,
      color: node.color ?? 'gray',
      shape: node.shape,
      style: node.style,
      tags: node.tags,
      x,
      y,
      viewId: view.id,
      depth,
      isViewGroup: true,
      drifts: node.drifts ?? null,
      viewLayoutDir: 'LR',
      // Ignore notes for Compound nodes
      notes: undefined,
    },
    zIndex: SeqZIndex.compound,
    position: {
      x,
      y,
    },
    draggable: false,
    selectable: false,
    focusable: false,
    style: {
      pointerEvents: 'none',
    },
    width,
    initialWidth: width,
    height,
    initialHeight: height,
  }
}

function toSeqParallelArea(
  { parallelPrefix, x, y, width, height }: LayoutedDynamicView.Sequence.ParallelArea,
  view: LayoutedDynamicView,
): Types.SequenceParallelArea {
  return {
    id: `seq-parallel-${parallelPrefix}` as NodeId,
    type: 'seq-parallel',
    data: {
      id: `seq-parallel-${parallelPrefix}` as NodeId,
      title: 'PARALLEL',
      technology: null,
      color: SeqParallelAreaColor.default,
      shape: 'rectangle',
      style: {},
      tags: [],
      x,
      y,
      level: 0,
      icon: null,
      width,
      height,
      description: null,
      viewId: view.id,
      parallelPrefix,
      drifts: null,
      viewLayoutDir: 'LR',
      // Ignore notes for Parallel Area nodes
      notes: undefined,
    },
    zIndex: SeqZIndex.subflows,
    position: {
      x,
      y,
    },
    draggable: false,
    deletable: false,
    selectable: false,
    focusable: false,
    style: {
      pointerEvents: 'none',
    },
    width,
    initialWidth: width,
    height,
    initialHeight: height,
  }
}

function toSeqActorNode(
  { id, x, y, width, height, ports }: LayoutedDynamicView.Sequence.Actor,
  actor: DiagramNode,
  bounds: BBox,
  view: LayoutedDynamicView,
): Types.SequenceActorNode {
  return {
    id: id,
    type: 'seq-actor',
    data: {
      id: actor.id,
      x,
      y,
      level: 0,
      icon: actor.icon ?? null,
      isMultiple: actor.style.multiple ?? false,
      title: actor.title,
      width,
      height,
      color: actor.color,
      navigateTo: actor.navigateTo ?? null,
      shape: actor.shape,
      style: actor.style,
      tags: actor.tags,
      modelFqn: actor.modelRef ?? null,
      technology: actor.technology ?? null,
      description: actor.description ?? null,
      viewHeight: bounds.height,
      viewId: view.id,
      notes: actor.notes,
      ports: ports as Writable<typeof ports>,
      drifts: actor.drifts ?? null,
      viewLayoutDir: 'LR',
    },
    deletable: false,
    selectable: true,
    zIndex: SeqZIndex.actor,
    position: { x, y },
    width,
    initialWidth: width,
    height,
    initialHeight: height,
  }
}
function toSeqStepEdge(
  { id, labelBBox, sourceHandle, targetHandle }: LayoutedDynamicView.Sequence.Step,
  edge: DiagramEdge,
  currentViewId: ViewId,
  stepnum: number,
  { flow }: Ctx,
): Types.SequenceStepEdge {
  let parent = flow?.parent(id)
  return {
    id,
    type: 'seq-step',
    data: {
      id,
      label: edge.label,
      technology: edge.technology,
      notes: edge.notes ?? null,
      navigateTo: edge.navigateTo !== currentViewId ? edge.navigateTo : null,
      controlPoints: null,
      labelBBox: {
        x: 0,
        y: 0,
        width: labelBBox?.width ?? edge.labelBBox?.width ?? 32,
        height: labelBBox?.height ?? edge.labelBBox?.height ?? 32,
      },
      stepnum,
      labelXY: null,
      points: edge.points,
      color: edge.color,
      line: edge.line,
      dir: 'forward',
      head: edge.head ?? 'normal',
      tail: edge.tail ?? 'none',
      astPath: edge.astPath,
      drifts: edge.drifts ?? null,
      parentFlow: parent ?
        {
          id: parent.id,
          type: parent._type,
        } :
        null,
    },
    deletable: false,
    selectable: true,
    focusable: false,
    zIndex: SeqZIndex.step,
    interactionWidth: 50,
    source: edge.source,
    sourceHandle,
    target: edge.target,
    targetHandle,
  }
}

type CtxWithFlow = SetNonNullable<Ctx, 'flow'>

function createSubflowNodes(
  ctx: CtxWithFlow,
): Types.SequenceSubflowArea[] {
  const nodes = [] as Types.SequenceSubflowArea[]

  let lastLeftNode = undefined as Types.SequenceSubflowArea | undefined
  ctx.flow.walk({
    subflow: ({ subflow, previous, parent }) => {
      const area = ctx.subflowArea(subflow.id)
      if (!area) {
        return false
      }

      const node = createSubflowNode(area, subflow, ctx)
      if (!previous) {
        node.data.isFirst = true
      }

      if (flowGuards.isAltOrTryBranch(subflow)) {
        node.position.y -= 1
        node.height! += 2
        node.initialHeight! += 2
      }

      nodes.push(node)

      return ({
        next: ctx.flow.subflows(subflow),
        onLeave: ({ lastVisited }) => {
          const nd = ctx.flow.guards.isSubFlow(lastVisited) && nodes.find(n => n.data.flowId === lastVisited.id)
          if (nd) {
            nd.data.isLast = true
          }
          lastLeftNode = node
        },
      })
    },
  })

  if (lastLeftNode) {
    lastLeftNode.data.isLast = true
  }
  return nodes
}

function createSubflowNode(
  area: LayoutedDynamicView.Sequence.SubflowArea,
  subflow: DynamicViewFlow.SubFlow.Any,
  ctx: CtxWithFlow,
): Types.SequenceSubflowArea {
  const { x, y, width, height } = area
  const id = NodeId(subflow.id)
  const level = ctx.flow.level(subflow.id)

  const flowData =
    // dprint-ignore
    ctx.flow.guards.isTry(subflow)
      ? composeTryData(area, subflow, ctx)
      : ctx.flow.guards.isAlt(subflow)
        ? composeAltData(area, subflow, ctx)
        : { flowType: subflow._type }

  return {
    id,
    type: 'seq-subflow',
    data: {
      id,
      flowId: subflow.id,
      title: subflow.title ?? '',
      technology: null,
      color: SeqParallelAreaColor.default,
      shape: 'rectangle',
      style: {},
      tags: [],
      x,
      y,
      level,
      icon: null,
      width,
      height,
      description: null,
      viewId: ctx.view.id,
      drifts: null,
      notes: undefined,
      ...flowData,
    },
    zIndex: SeqZIndex.subflows + level,
    position: { x, y },
    draggable: false,
    deletable: false,
    // selectable: false,
    focusable: false,
    // style: {
    //   pointerEvents: 'none',
    // },
    width,
    initialWidth: width,
    height,
    initialHeight: height,
  }
}

const toSequenceBranch = (
  parent: XYPoint,
  area: LayoutedDynamicView.Sequence.SubflowArea,
): Types.SequenceSubflowData.Branch => ({
  flowId: area.id,
  x: area.x - parent.x,
  y: area.y - parent.y,
  width: area.width,
  height: area.height,
})

function composeTryData(
  parent: XYPoint,
  tryflow: DynamicViewFlow.SubFlow.Try,
  { flow, subflowArea }: CtxWithFlow,
): Types.SequenceSubflowData.Try {
  const blocks = flow.unwindTry(tryflow)

  const tryBlockArea = nonNullable(subflowArea(blocks.tryBlock.id))
  const tryBlock = toSequenceBranch(parent, tryBlockArea)

  const catchBlockArea = blocks.catchBlock ? subflowArea(blocks.catchBlock.id) : undefined
  const catchBlock = catchBlockArea ? toSequenceBranch(parent, catchBlockArea) : undefined

  const finallyBlockArea = blocks.finallyBlock ? subflowArea(blocks.finallyBlock.id) : undefined
  const finallyBlock = finallyBlockArea ? toSequenceBranch(parent, finallyBlockArea) : undefined

  return {
    flowType: 'try' as const,
    tryBlock,
    catchBlock,
    finallyBlock,
  }
}

function composeAltData(
  parent: XYPoint,
  altflow: DynamicViewFlow.SubFlow.Alt,
  { flow, subflowArea }: CtxWithFlow,
): Types.SequenceSubflowData.Alt {
  const branches = flow.subflows(altflow).flatMap(f => {
    const area = subflowArea(f.id)
    if (area) {
      return {
        ...toSequenceBranch(parent, area),
        flowType: f._type,
      }
    }
    return []
  })
  return {
    flowType: 'alt' as const,
    branches,
  }
}
