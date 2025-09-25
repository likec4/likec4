import {
  type BBox,
  type DiagramNode,
  type LayoutedDynamicView,
  type NodeId,
  getParallelStepsPrefix,
  isStepEdgeId,
  RichText,
} from '@likec4/core/types'
import { DefaultMap, invariant, nonNullable } from '@likec4/core/utils'
import type { NodeHandle } from '@xyflow/system'
import { hasAtLeast } from 'remeda'
import { roundDpr } from '../../utils/roundDpr'
import { toXYFlowPosition } from '../../utils/xyflow'
import type { Types } from '../types'
import type { Step } from './_types'
import {
  CONTINUOUS_OFFSET,
  SeqParallelAreaColor,
  SeqZIndex,
} from './const'
import { SequenceViewLayouter } from './layouter'
import { buildCompounds } from './utils'

type Port = {
  step: Step
  row: number
  type: 'source' | 'target'
  position: 'left' | 'right' | 'top' | 'bottom'
}

export function sequenceViewToXY(
  view: LayoutedDynamicView,
): {
  bounds: BBox
  xynodes: Array<Types.SequenceActorNode | Types.SequenceParallelArea | Types.ViewGroupNode>
  xyedges: Array<Types.SequenceStepEdge>
} {
  const actors = [] as Array<DiagramNode>
  const actorPorts = new DefaultMap<DiagramNode, Port[]>(() => [])

  const steps = [] as Array<Step>

  const getNode = (id: string) => nonNullable(view.nodes.find(n => n.id === id))
  const parentsLookup: DefaultMap<DiagramNode, DiagramNode[]> = new DefaultMap(
    key => {
      const parent = key.parent ? getNode(key.parent) : null
      if (parent) {
        return [parent, ...parentsLookup.get(parent)]
      }
      return []
    },
  )

  const addActor = (...[source, target]: [DiagramNode, DiagramNode]) => {
    // source actor not yet added
    if (!actors.includes(source)) {
      const indexOfTarget = actors.indexOf(target)
      if (indexOfTarget > 0) {
        actors.splice(indexOfTarget, 0, source)
      } else {
        actors.push(source)
      }
    }
    if (!actors.includes(target)) {
      actors.push(target)
    }
  }

  let row = 0

  for (const edge of view.edges.filter(e => isStepEdgeId(e.id))) {
    const prevStep = steps.at(-1)
    const source = getNode(edge.source)
    const target = getNode(edge.target)

    if (source.children.length || target.children.length) {
      console.error('Sequence view does not support nested actors')
      continue
    }

    let sourceColumn = actors.indexOf(source)
    let targetColumn = actors.indexOf(target)

    const alreadyAdded = sourceColumn >= 0 && targetColumn >= 0

    if (!alreadyAdded) {
      if (edge.dir === 'back') {
        addActor(target, source)
      } else {
        addActor(source, target)
      }
      sourceColumn = actors.indexOf(source)
      targetColumn = actors.indexOf(target)
    }

    const isSelfLoop = source === target
    const isBack = sourceColumn > targetColumn
    const parallelPrefix = getParallelStepsPrefix(edge.id)

    let isContinuing = false
    if (prevStep && prevStep.target == source && prevStep.parallelPrefix === parallelPrefix) {
      isContinuing = prevStep.isSelfLoop !== isSelfLoop || prevStep.isBack === isBack
    }

    if (!isContinuing) {
      row++
    }

    const step: Step = {
      id: edge.id,
      from: {
        column: sourceColumn,
        row,
      },
      to: {
        column: targetColumn,
        row: isSelfLoop ? ++row : row,
      },
      edge,
      isSelfLoop,
      isBack,
      parallelPrefix,
      offset: isContinuing ? (prevStep?.offset ?? 0) + CONTINUOUS_OFFSET : 0,
      source,
      target,
      label: edge.labelBBox
        ? {
          height: edge.labelBBox.height + 8 + (edge.navigateTo ? 20 : 0),
          width: edge.labelBBox.width + 16,
          text: edge.label,
        }
        : null,
    }
    steps.push(step)
    actorPorts.get(source).push({ step, row, type: 'source', position: isBack && !isSelfLoop ? 'left' : 'right' })
    actorPorts.get(target).push({ step, row, type: 'target', position: isBack || isSelfLoop ? 'right' : 'left' })
  }

  // Update columns, as actors may have been re-ordered
  for (const step of steps) {
    step.from.column = actors.indexOf(step.source)
    step.to.column = actors.indexOf(step.target)
  }

  invariant(hasAtLeast(actors, 1), 'actors array must not be empty')

  const layout = new SequenceViewLayouter({
    actors,
    steps,
    compounds: buildCompounds(actors, view.nodes),
  })

  const bounds = layout.getViewBounds()

  return {
    bounds,
    xynodes: [
      ...layout.getCompoundBoxes().map((box, i) => toCompoundArea(box, i, view)),
      ...layout.getParallelBoxes().map(box => toSeqParallelArea(box, view)),
      ...actors.map(actor =>
        toSeqActorNode({
          actor,
          ports: actorPorts.get(actor),
          bounds,
          layout,
          view,
        })
      ),
    ],
    xyedges: steps.map(({ id, edge, ...step }): Types.SequenceStepEdge => ({
      id: id,
      type: 'seq-step',
      data: {
        id,
        label: step.label?.text ?? null,
        technology: edge.technology,
        notes: RichText.from(edge.notes),
        navigateTo: edge.navigateTo,
        controlPoints: edge.controlPoints ?? null,
        labelBBox: {
          x: 0,
          y: 0,
          width: step.label?.width ?? edge.labelBBox?.width ?? 32,
          height: step.label?.height ?? edge.labelBBox?.height ?? 32,
        },
        labelXY: null,
        points: edge.points,
        color: edge.color ?? 'gray',
        line: edge.line ?? 'dashed',
        dir: 'forward',
        head: edge.head ?? 'normal',
        tail: edge.tail ?? 'none',
        astPath: edge.astPath,
      },
      selectable: true,
      focusable: false,
      zIndex: 20,
      interactionWidth: 40,
      source: step.source.id,
      sourceHandle: id + '_source',
      target: step.target.id,
      targetHandle: id + '_target',
    })),
  }
}

/**
 * Shows a compound as a view group node
 */
function toCompoundArea(
  { node, x, y, width, height, depth }: BBox & { node: DiagramNode; depth: number },
  index: number,
  view: LayoutedDynamicView,
): Types.ViewGroupNode {
  return {
    id: `${node.id}-${index}` as NodeId,
    type: 'view-group',
    data: {
      id: node.id,
      title: node.title,
      color: node.color ?? 'gray',
      shape: node.shape,
      style: node.style,
      tags: node.tags,
      position: [x, y],
      viewId: view.id,
      depth,
      isViewGroup: true,
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
  { parallelPrefix, x, y, width, height }: BBox & { parallelPrefix: string },
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
      position: [x, y],
      level: 0,
      icon: null,
      width,
      height,
      description: RichText.EMPTY,
      viewId: view.id,
      parallelPrefix,
    },
    zIndex: SeqZIndex.parallel,
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

function toSeqActorNode({ actor, ports: _ports, bounds, layout, view }: {
  actor: DiagramNode
  ports: Port[]
  bounds: BBox
  layout: SequenceViewLayouter
  view: LayoutedDynamicView
}): Types.SequenceActorNode {
  const { x, y, width, height } = layout.getActorBox(actor)

  const { ports, handles } = _ports.reduce((acc, p) => {
    const bbox = layout.getPortCenter(p.step, p.type)
    acc.ports.push({
      id: p.step.id + '_' + p.type,
      cx: roundDpr(bbox.cx - x),
      cy: roundDpr(bbox.cy - y),
      height: bbox.height,
      type: p.type,
      position: p.position,
    })
    acc.handles.push({
      id: p.step.id + '_' + p.type,
      position: toXYFlowPosition(p.position),
      x: bbox.cx,
      y: bbox.cy,
      width: 5,
      height: bbox.height,
      type: p.type,
    })
    return acc
  }, {
    ports: [] as Types.SequenceActorNodePort[],
    handles: [] as NodeHandle[],
  })

  return {
    id: actor.id,
    type: 'seq-actor',
    data: {
      id: actor.id,
      position: [x, y],
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
      description: RichText.from(actor.description),
      viewHeight: bounds.height,
      viewId: view.id,
      ports,
      // ports: ports.map((p): Types.SequenceActorNodePort => {
      //   const bbox = layout.getPortCenter(p.step, p.type)
      //   return ({
      //     id: p.step.id + '_' + p.type,
      //     cx: bbox.cx - x,
      //     cy: bbox.cy - y,
      //     height: bbox.height,
      //     type: p.type,
      //     position: p.position,
      //   })
      // }),
    },
    deletable: false,
    selectable: true,
    zIndex: SeqZIndex.actor,
    position: { x, y },
    width,
    initialWidth: width,
    height,
    initialHeight: height,
    handles,
  }
}
