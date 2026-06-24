import { nonNullable } from '@likec4/core'
import type {
  BBox,
  DiagramEdge,
  DiagramNode,
  LayoutedDynamicView,
  NodeId,
  ViewId,
} from '@likec4/core/types'
import type { Writable } from 'type-fest'
import type { Types } from '../types'
import {
  SeqParallelAreaColor,
  SeqZIndex,
} from './const'

/**
 * Converts a sequence layout to XY flow nodes and edges.
 * @param view The next dynamic view which contains the sequence layout.
 * @param currentViewId The ID of the current view (optional, used to exclude navigation to the current view)
 */
export function sequenceLayoutToXY(
  view: LayoutedDynamicView,
  currentViewId: ViewId | undefined,
): {
  xynodes: Array<
    | Types.SequenceActorNode
    | Types.SequenceParallelArea
    | Types.ViewGroupNode
    | Types.SequenceFrameNode
    | Types.SequenceFrameBgNode
    | Types.SequenceLifelineNode
    | Types.SequenceNoteNode
    | Types.SequenceActivationNode
  >
  xyedges: Array<Types.SequenceStepEdge>
} {
  const { actors, steps, compounds, parallelAreas, frames, activations, notes, bounds } = view.sequenceLayout

  const xynodes = [] as Array<
    | Types.SequenceActorNode
    | Types.SequenceParallelArea
    | Types.ViewGroupNode
    | Types.SequenceFrameNode
    | Types.SequenceFrameBgNode
    | Types.SequenceLifelineNode
    | Types.SequenceNoteNode
    | Types.SequenceActivationNode
  >
  const xyedges = [] as Array<Types.SequenceStepEdge>

  const getNode = (id: NodeId): DiagramNode => {
    return nonNullable(view.nodes.find((n) => n.id === id))
  }

  for (const compound of compounds) {
    xynodes.push(toCompoundArea(compound, getNode(compound.origin), view))
  }

  for (const parallelArea of parallelAreas) {
    xynodes.push(toSeqParallelArea(parallelArea, view))
  }

  // Frames — split into bg (fill) and chrome (badge+text+separators)
  for (const frame of frames) {
    xynodes.push(toSeqFrameBgNode(frame, view))
    xynodes.push(toSeqFrameChromeNode(frame, view))
  }

  // Notes — above edges
  for (const note of notes) {
    xynodes.push(toSeqNoteNode(note, view))
  }

  // Lifelines — dedicated nodes below all frames, above compound background
  for (const actor of actors) {
    xynodes.push(toSeqLifelineNode(actor, bounds, view))
  }

  for (const actor of actors) {
    xynodes.push(toSeqActorNode(actor, getNode(actor.id), bounds, view))
  }

  // Activation bars — above actor lifelines, below step edges
  for (const activation of activations) {
    xynodes.push(toSeqActivationNode(activation, actors, view))
  }

  // Autonumber: drive the edge-label step-number BADGE (not the label text) with a
  // sequential value. The number must be monotonically increasing across ALL steps
  // using the LINEAR index from view.edges (not the position in the steps array), so
  // that steps inside alt/loop/par blocks get unique, sequential numbers. The native
  // badge derives `extractStep(id)` which yields the SAME top-level number for every
  // nested frame step (e.g. `step-03.alt.1.2` → 3) — that bug is bypassed by passing
  // an explicit `stepNumber` override. When autonumber is disabled, pass `null` to
  // hide the badge entirely (Mermaid only numbers when autonumber is on).
  const an = view.autonumber
  const autonumberEnabled = an?.enabled === true
  const anStart = an?.start ?? 1
  const anStep = an?.step ?? 1

  // Precompute a stable edge-index map from view.edges order
  const edgeIndexMap = new Map(view.edges.map((e, i) => [e.id, i]))

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!
    const edge = view.edges.find((e) => e.id === step.id)
    if (!edge) {
      throw new Error(`Edge ${step.id} not found`)
    }
    // Use position in view.edges (canonical linear order) for the numeric badge
    const linearIdx = edgeIndexMap.get(step.id) ?? i
    const stepNumber = autonumberEnabled ? anStart + linearIdx * anStep : null
    xyedges.push(toSeqStepEdge(step, edge, currentViewId ?? view.id, stepNumber))
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
    zIndex: SeqZIndex.legacyParallel,
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

function toSeqLifelineNode(
  actor: LayoutedDynamicView.Sequence.Actor,
  bounds: BBox,
  view: LayoutedDynamicView,
): Types.SequenceLifelineNode {
  const actorBottom = actor.y + actor.height
  const lifelineHeight = Math.max(bounds.height - actorBottom, 0)
  const x = actor.x + actor.width / 2 - 1
  return {
    id: `seq-lifeline-${actor.id}` as NodeId,
    type: 'seq-lifeline',
    data: {
      viewId: view.id,
      drifts: null,
    },
    zIndex: SeqZIndex.lifeline,
    position: { x, y: actorBottom },
    draggable: false,
    deletable: false,
    selectable: false,
    focusable: false,
    style: { pointerEvents: 'none' },
    width: 2,
    initialWidth: 2,
    height: lifelineHeight,
    initialHeight: lifelineHeight,
  }
}

function toSeqStepEdge(
  { id, labelBBox, sourceHandle, targetHandle }: LayoutedDynamicView.Sequence.Step,
  edge: DiagramEdge,
  currentViewId: ViewId,
  stepNumber: number | null,
): Types.SequenceStepEdge {
  return {
    id,
    type: 'seq-step',
    data: {
      id,
      label: edge.label,
      stepNumber,
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
    zIndex: 20,
    interactionWidth: 40,
    source: edge.source,
    sourceHandle,
    target: edge.target,
    targetHandle,
  }
}

function toSeqFrameBgNode(
  { id, kind, depth, x, y, width, height }: LayoutedDynamicView.Sequence.Frame,
  view: LayoutedDynamicView,
): Types.SequenceFrameBgNode {
  return {
    id: `seq-frame-${id}-bg` as NodeId,
    type: 'seq-frame-bg',
    data: {
      kind,
      depth,
      viewId: view.id,
      drifts: null,
    },
    zIndex: SeqZIndex.frameBg - depth,
    position: { x, y },
    draggable: false,
    deletable: false,
    selectable: false,
    focusable: false,
    style: { pointerEvents: 'none' },
    width,
    initialWidth: width,
    height,
    initialHeight: height,
  }
}

function toSeqFrameChromeNode(
  { id, kind, label, condition, depth, parent, x, y, width, height, branches }: LayoutedDynamicView.Sequence.Frame,
  view: LayoutedDynamicView,
): Types.SequenceFrameNode {
  return {
    id: `seq-frame-${id}` as NodeId,
    type: 'seq-frame',
    data: {
      kind,
      label,
      condition,
      depth,
      parent,
      branches: branches.map(b => ({
        label: b.label,
        condition: b.condition,
        separatorYs: b.separatorYs,
      })),
      viewId: view.id,
      drifts: null,
    },
    zIndex: SeqZIndex.frameChrome,
    position: { x, y },
    draggable: false,
    deletable: false,
    selectable: false,
    focusable: false,
    style: { pointerEvents: 'none' },
    width,
    initialWidth: width,
    height,
    initialHeight: height,
  }
}

/** Activation bar width in px */
const ACTIVATION_BAR_WIDTH = 14

function toSeqActivationNode(
  { actor, startY, endY, depth }: LayoutedDynamicView.Sequence.Activation,
  actors: ReadonlyArray<LayoutedDynamicView.Sequence.Actor>,
  view: LayoutedDynamicView,
): Types.SequenceActivationNode {
  const actorLayout = actors.find(a => a.id === actor)
  const actorCenterX = actorLayout
    ? actorLayout.x + actorLayout.width / 2
    : 0
  const barWidth = ACTIVATION_BAR_WIDTH
  const barHalfWidth = barWidth / 2
  const x = actorCenterX - barHalfWidth + depth * 6
  const height = Math.max(endY - startY, 4)
  return {
    id: `seq-activation-${actor}-${depth}-${startY}` as NodeId,
    type: 'seq-activation',
    data: {
      actor,
      depth,
      viewId: view.id,
      drifts: null,
    },
    zIndex: SeqZIndex.activation,
    position: { x, y: startY },
    draggable: false,
    deletable: false,
    selectable: false,
    focusable: false,
    style: { pointerEvents: 'none' },
    width: barWidth,
    initialWidth: barWidth,
    height,
    initialHeight: height,
  }
}

function toSeqNoteNode(
  { id, placement, text, x, y, width, height }: LayoutedDynamicView.Sequence.Note,
  view: LayoutedDynamicView,
): Types.SequenceNoteNode {
  return {
    id: `seq-note-${id}` as NodeId,
    type: 'seq-note',
    data: {
      placement,
      text,
      viewId: view.id,
      drifts: null,
    },
    zIndex: SeqZIndex.note,
    position: { x, y },
    draggable: false,
    deletable: false,
    selectable: false,
    focusable: false,
    style: { pointerEvents: 'none' },
    width,
    initialWidth: width,
    height,
    initialHeight: height,
  }
}
