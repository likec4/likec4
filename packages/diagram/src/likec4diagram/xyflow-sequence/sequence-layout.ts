import { invariant, nonNullable } from '@likec4/core'
import {
  type BBox,
  type DiagramEdge,
  type DiagramNode,
  type DynamicViewFlowOps,
  type LayoutedDynamicView,
  type StepPath,
  type ViewId,
  type XYPoint,
  dynamicViewFlow,
  hasProp,
  NodeId,
} from '@likec4/core/types'
import { flatMap, isArray } from 'remeda'
import type { SetNonNullable, SetRequired, Writable } from 'type-fest'
import type { Types } from '../types'
import {
  SeqParallelAreaColor,
  SeqZIndex,
} from './const'
import { calcSequenceLayout } from './sequence-view'

type Ctx = {
  view: Omit<LayoutedDynamicView, 'sequenceLayout' | 'flow'>
  flow: DynamicViewFlowOps | undefined
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
    xynodes.push(...flatMap(subflows, s => mapSubflows(s, ctx) ?? []))
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
    interactionWidth: 40,
    source: edge.source,
    sourceHandle,
    target: edge.target,
    targetHandle,
  }
}

type CtxWithFlow = SetNonNullable<Ctx, 'flow'>

function mapSubflows(
  { _type, ...subflow }: LayoutedDynamicView.Sequence.SubflowArea,
  ctx: CtxWithFlow,
): Types.SequenceSubflowArea | undefined {
  // Exclude these subflow areas from rendering
  // (we render them inside parents)
  if (ctx.flow.guards.type.isAltOrTryBranch(_type)) {
    return undefined
  }
  const { id: ID, x, y, width, height } = subflow
  const data = subflowAreaData({ ...subflow, _type }, ctx)
  return {
    id: ID,
    type: 'seq-subflow',
    data,
    zIndex: SeqZIndex.subflows + data.level,
    position: { x, y },
    draggable: false,
    deletable: false,
    selectable: false,
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

function subflowAreaData(
  subflow: LayoutedDynamicView.Sequence.SubflowArea & { _type: Types.SequenceSubflowData['flowType'] },
  ctx: CtxWithFlow,
): Types.SequenceSubflowData {
  const { id: ID, _type, x, y, width, height } = subflow
  const id = NodeId(ID)

  const flowData =
    // dprint-ignore
    _type === 'try'
      ? composeTryData(subflow, ctx)
      : _type === 'alt'
        ? composeAltData(subflow, ctx)
        : { flowType: _type, hasSubflows: ctx.flow.hasSubflows(ID) }

  return {
    id,
    flowId: ID,
    title: ctx.flow.lookup(ID).title ?? '',
    technology: null,
    color: SeqParallelAreaColor.default,
    shape: 'rectangle',
    style: {},
    tags: [],
    x,
    y,
    level: ctx.flow.level(ID),
    icon: null,
    width,
    height,
    description: null,
    viewId: ctx.view.id,
    drifts: null,
    notes: undefined,
    ...flowData,
  }
}

const toSequenceBranch = (
  parent: XYPoint,
  flow: DynamicViewFlowOps,
  area: LayoutedDynamicView.Sequence.SubflowArea,
): Types.SequenceSubflowData.Branch => ({
  flowId: area.id,
  title: flow.lookup(area.id).title ?? undefined,
  x: area.x - parent.x,
  y: area.y - parent.y,
  width: area.width,
  height: area.height,
  hasSubflows: flow.hasSubflows(area.id),
})

function composeTryData(
  { id, ...parent }: Pick<LayoutedDynamicView.Sequence.SubflowArea, 'id' | 'x' | 'y'>,
  { flow, subflowArea }: CtxWithFlow,
): Types.SequenceSubflowData.Try {
  const blocks = flow.unwindTry(flow.lookup(id, 'try'))

  const tryBlockArea = nonNullable(subflowArea(blocks.tryBlock.id))
  const tryBlock = toSequenceBranch(parent, flow, tryBlockArea)

  const catchBlockArea = blocks.catchBlock ? subflowArea(blocks.catchBlock.id) : undefined
  const catchBlock = catchBlockArea ? toSequenceBranch(parent, flow, catchBlockArea) : undefined

  const finallyBlockArea = blocks.finallyBlock ? subflowArea(blocks.finallyBlock.id) : undefined
  const finallyBlock = finallyBlockArea ? toSequenceBranch(parent, flow, finallyBlockArea) : undefined

  return {
    flowType: 'try' as const,
    tryBlock,
    catchBlock,
    finallyBlock,
    hasSubflows: tryBlock.hasSubflows || catchBlock?.hasSubflows || finallyBlock?.hasSubflows || false,
  }
}

function composeAltData(
  { id, ...parent }: Pick<LayoutedDynamicView.Sequence.SubflowArea, 'id' | 'x' | 'y'>,
  { flow, subflowArea }: CtxWithFlow,
): Types.SequenceSubflowData.Alt {
  const branches = flow.subflows(id).flatMap(f => {
    const area = subflowArea(f.id)
    if (area) {
      invariant(flow.guards.type.isAltBranch(area._type))
      return {
        ...toSequenceBranch(parent, flow, area),
        flowType: area._type,
      }
    }
    return []
  })
  return {
    flowType: 'alt' as const,
    branches,
    hasSubflows: branches.some(branch => branch.hasSubflows),
  }
}
