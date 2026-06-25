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
  flowGuards,
  NodeId,
} from '@likec4/core/types'
import { flatMap, isArray } from 'remeda'
import type { Writable } from 'type-fest'
import type { Types } from '../types'
import {
  SeqParallelAreaColor,
  SeqZIndex,
} from './const'
import { calcSequenceLayout } from './sequence-view'

type Ctx = {
  view: Omit<LayoutedDynamicView, 'sequenceLayout' | 'flow'>
  flow: DynamicViewFlowOps
  layout: LayoutedDynamicView.Sequence.Layout
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
  bounds: BBox
} {
  const flow = dynamicViewFlow(view)
  const ctx: Ctx = {
    view,
    flow,
    layout: calcSequenceLayout(view),
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

  // In manual layouts, subflows are emtpy
  if (isArray(subflows)) {
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

  let stepIndex = 0
  for (const step of steps) {
    const edge = view.edges.find((e) => e.id === step.id)
    if (!edge) {
      throw new Error(`Edge ${step.id} not found`)
    }
    xyedges.push(toSeqStepEdge(step, edge, currentViewId ?? view.id, stepIndex++, ctx))
  }

  return {
    xynodes,
    xyedges,
    layout: ctx.layout,
    bounds,
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
    // zIndex: SeqZIndex.compound,
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
  index: number,
  { flow }: Ctx,
): Types.SequenceStepEdge {
  const parent = flow.parent(id)
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
      index,
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

const exclude = [
  'try-block',
  'try-catch',
  'try-finally',
  'alt-when',
  'alt-else',
  'alt-if',
] as const
const isExcluded = (v: unknown): v is (typeof exclude)[number] => exclude.includes(v as any)

function mapSubflows(
  { _type, ...subflow }: LayoutedDynamicView.Sequence.SubflowArea,
  ctx: Ctx,
): Types.SequenceSubflowArea | undefined {
  if (isExcluded(_type)) {
    return undefined
  }
  const { id: ID, x, y, width, height } = subflow
  return {
    id: ID,
    type: 'seq-subflow',
    data: subflowAreaData({ ...subflow, _type }, ctx),
    zIndex: SeqZIndex.subflows,
    position: {
      x,
      y,
    },
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
  { layout: { subflows }, view, flow }: Ctx,
): Types.SequenceSubflowData {
  const { id: ID, _type, x, y, width, height } = subflow
  const id = NodeId(ID)

  const flowData = _type === 'try'
    ? composeTryData(subflow, flow, subflows)
    : _type === 'alt'
    ? composeAltData(subflow, flow, subflows)
    : { flowType: _type, hasSubflows: flow.hasSubflows(ID) }

  return {
    id,
    flowId: ID,
    title: flow.lookup(ID).title ?? '',
    technology: null,
    color: SeqParallelAreaColor.default,
    shape: 'rectangle',
    style: {},
    tags: [],
    x,
    y,
    level: flow.level(ID),
    icon: null,
    width,
    height,
    description: null,
    viewId: view.id,
    drifts: null,
    // Ignore notes for Parallel Area nodes
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
  flow: DynamicViewFlowOps,
  all: readonly LayoutedDynamicView.Sequence.SubflowArea[],
): Types.SequenceSubflowData.Try {
  const findArea = (id: StepPath) => all.find((area) => area.id === id)

  const blocks = flow.unwindTry(flow.lookup(id, 'try'))
  const tryBlockArea = nonNullable(findArea(blocks.tryBlock.id))
  const catchBlockArea = blocks.catchBlock ? findArea(blocks.catchBlock.id) : undefined
  const finallyBlockArea = blocks.finallyBlock ? findArea(blocks.finallyBlock.id) : undefined
  return {
    flowType: 'try' as const,
    tryBlock: toSequenceBranch(parent, flow, tryBlockArea),
    catchBlock: catchBlockArea ? toSequenceBranch(parent, flow, catchBlockArea) : undefined,
    finallyBlock: finallyBlockArea ? toSequenceBranch(parent, flow, finallyBlockArea) : undefined,
    hasSubflows: flow.hasSubflows(blocks.tryBlock) ||
      (!!blocks.catchBlock && flow.hasSubflows(blocks.catchBlock)) ||
      (!!blocks.finallyBlock && flow.hasSubflows(blocks.finallyBlock)),
  }
}

function composeAltData(
  { id, ...parent }: Pick<LayoutedDynamicView.Sequence.SubflowArea, 'id' | 'x' | 'y'>,
  flow: DynamicViewFlowOps,
  all: readonly LayoutedDynamicView.Sequence.SubflowArea[],
): Types.SequenceSubflowData.Alt {
  const findArea = (areaId: StepPath) => all.find((area) => area.id === areaId)

  const branches = flow.nested(id).flatMap(f => {
    const area = findArea(f.id)
    if (area) {
      invariant(flowGuards.type.isAltBranch(area._type))
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
