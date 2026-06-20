import { nonNullable } from '@likec4/core'
import {
  type BBox,
  type DiagramEdge,
  type DiagramNode,
  type DynamicViewFlowOps,
  type LayoutedDynamicView,
  type ViewId,
  dynamicViewFlow,
  NodeId,
} from '@likec4/core/types'
import { isArray } from 'remeda'
import type { Writable } from 'type-fest'
import type { Types } from '../types'
import {
  SeqParallelAreaColor,
  SeqZIndex,
} from './const'
import { calcSequenceLayout } from './sequence-view'

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
} {
  const flow = dynamicViewFlow(view)
  const { actors, steps, compounds, parallelAreas, subflows, bounds } = calcSequenceLayout(view)

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
    for (const subflow of subflows) {
      xynodes.push(toSeqSubflowArea(subflow, view, flow))
    }
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
    xyedges.push(toSeqStepEdge(step, edge, currentViewId ?? view.id, stepIndex++))
  }

  return {
    xynodes,
    xyedges,
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

function toSeqSubflowArea(
  { id: ID, _type, zIndex, x, y, width, height }: LayoutedDynamicView.Sequence.SubflowArea,
  view: LayoutedDynamicView,
  flow: DynamicViewFlowOps,
): Types.SequenceSubflowArea {
  const id = NodeId(ID)
  return {
    id,
    type: 'seq-subflow',
    data: {
      id,
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
      flowType: _type,
      drifts: null,
      // Ignore notes for Parallel Area nodes
      notes: undefined,
    },
    zIndex: SeqZIndex.subflows + zIndex,
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
): Types.SequenceStepEdge {
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
