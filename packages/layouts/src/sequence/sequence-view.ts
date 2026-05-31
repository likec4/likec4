import type { ComputedDynamicView, DiagramEdge, DiagramNode, LayoutedDynamicView, NodeId } from '@likec4/core/types'
import { getParallelStepsPrefix, isStepEdgeId } from '@likec4/core/types'
import { DefaultMap, invariant, nonNullable } from '@likec4/core/utils'
import { flat, groupByProp, hasAtLeast, map, mapValues, pipe, values } from 'remeda'
import type { SequenceActor, SequenceActorStepPort, Step } from './_types'
import {
  CONTINUOUS_OFFSET,
  LABEL_OFFSET,
  SEQ_ACTOR_HEIGHT,
  SEQ_ACTOR_WIDTH,
} from './const'
import { SequenceViewLayouter } from './layouter'
import { buildCompounds } from './utils'

type Port = {
  step: Step
  row: number
  type: 'source' | 'target'
  position: 'left' | 'right' | 'top' | 'bottom'
}

export function calcSequenceLayout(
  view: LayoutedDynamicView,
  computedView?: ComputedDynamicView,
): LayoutedDynamicView.Sequence.Layout {
  const actorNodes = new Set<DiagramNode>()

  const getNode = (id: string) => nonNullable(view.nodes.find(n => n.id === id))

  // Step 1 - prepare steps and actors
  const preparedSteps = [] as Array<{
    edge: DiagramEdge
    source: DiagramNode
    target: DiagramNode
  }>

  for (const edge of view.edges.filter(e => isStepEdgeId(e.id))) {
    const source = getNode(edge.source)
    const target = getNode(edge.target)

    if (source.children.length || target.children.length) {
      console.error('Sequence view does not support nested actors')
      continue
    }
    actorNodes.add(source)
    actorNodes.add(target)
    preparedSteps.push({ edge, source, target })
  }

  // Keep initial order of actors (preserve original DiagramNode references for identity checks)
  const actors = view.nodes.filter(n => actorNodes.has(n))
  invariant(hasAtLeast(actors, 1), 'actors array must not be empty')

  // Build compactly-sized actor proxies for the layout engine so actor cards
  // are smaller than graphviz-computed sizes and leave room for step arrows.
  // These proxies are ONLY used inside the layouter; the original nodes are
  // used for everything else (port resolution, column index lookup, etc.).
  const actorsForLayout = map(actors, n => ({
    ...n,
    width: SEQ_ACTOR_WIDTH,
    height: SEQ_ACTOR_HEIGHT,
  }))

  const actorPorts = new DefaultMap<DiagramNode, Port[]>(() => [])

  const steps = [] as Array<Step>

  let row = 0

  for (const { edge, source, target } of preparedSteps) {
    const prevStep = steps.at(-1)

    let sourceColumn = actors.indexOf(source)
    let targetColumn = actors.indexOf(target)

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
      offset: isContinuing
        ? (prevStep?.offset ?? 0) + CONTINUOUS_OFFSET
          + (isSelfLoop ? (prevStep?.label?.height ?? 0) + 2 * LABEL_OFFSET : 0)
        : 0,
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

  // Build step ID → row index map
  const stepRowMap = new Map<string, number>()
  for (const step of steps) {
    stepRowMap.set(step.id, step.from.row)
  }

  const layout = new SequenceViewLayouter({
    actors: actorsForLayout,
    steps,
    compounds: buildCompounds(actors, view.nodes),
  })

  // Register step→row mappings in layouter
  for (const [stepId, rowIdx] of stepRowMap) {
    layout.recordStepRow(stepId, rowIdx)
  }

  // --- Phase 1: Register frames ---
  const computedFrames = computedView?.frames ?? view.frames
  if (computedFrames && computedFrames.length > 0) {
    for (const frame of computedFrames) {
      // Collect all step edge IDs in all branches of this frame
      const branches = frame.branches.map(branch => {
        const rowsInBranch: number[] = []
        for (const stepId of branch.stepIds) {
          const r = stepRowMap.get(stepId)
          if (r !== undefined) rowsInBranch.push(r)
        }
        const rowStart = rowsInBranch.length > 0 ? Math.min(...rowsInBranch) : 0
        const rowEnd = rowsInBranch.length > 0 ? Math.max(...rowsInBranch) : 0
        return {
          label: branch.label,
          condition: branch.condition,
          rowStart,
          rowEnd,
        }
      })

      // Find column range across all steps in this frame
      const allStepIds = frame.branches.flatMap(b => [...b.stepIds])
      const allCols: number[] = []
      for (const stepId of allStepIds) {
        const step = steps.find(s => s.id === stepId)
        if (step) {
          allCols.push(step.from.column, step.to.column)
        }
      }
      if (allCols.length === 0) continue

      layout.registerFrame({
        id: frame.id,
        kind: frame.kind,
        label: frame.label,
        condition: frame.condition,
        depth: frame.depth,
        parent: frame.parent,
        minCol: Math.min(...allCols),
        maxCol: Math.max(...allCols),
        branches,
      })
    }
  }

  // --- Phase 2: Register activations ---
  const markers = computedView?.markers ?? view.markers
  if (markers && markers.length > 0) {
    // Track per-actor activation stacks: {startStepId, startRow, depth}
    type ActivationStart = { startStepId: string | null; startRow: number | null; depth: number }
    const activationStacks = new Map<string, ActivationStart[]>()

    // lifecycle boundary rows per actor
    const actorCreateRow = new Map<string, number>()
    const actorDestroyRow = new Map<string, number>()

    for (const marker of markers) {
      const afterRow = marker.afterStep !== undefined ? (stepRowMap.get(marker.afterStep) ?? null) : null

      switch (marker.kind) {
        case 'create':
          if (afterRow !== null) actorCreateRow.set(marker.actor, afterRow)
          break
        case 'destroy':
          if (afterRow !== null) actorDestroyRow.set(marker.actor, afterRow)
          break
        case 'activate': {
          const stack = activationStacks.get(marker.actor) ?? []
          activationStacks.set(marker.actor, stack)
          stack.push({
            startStepId: marker.afterStep ?? null,
            startRow: afterRow !== null ? afterRow + 1 : null,
            depth: stack.length,
          })
          break
        }
        case 'deactivate': {
          const stack = activationStacks.get(marker.actor)
          if (stack && stack.length > 0) {
            const activation = stack.pop()!
            layout.registerActivation({
              actor: marker.actor,
              startStepId: activation.startStepId,
              endStepId: marker.afterStep ?? null,
              startRow: activation.startRow,
              endRow: afterRow !== null ? afterRow + 1 : null,
              startYOverride: null,
              endYOverride: null,
              depth: activation.depth,
            })
          }
          break
        }
        default:
          break
      }
    }

    // Close any unclosed activations at view end
    for (const [actorId, stack] of activationStacks) {
      for (const activation of [...stack].reverse()) {
        layout.registerActivation({
          actor: actorId,
          startStepId: activation.startStepId,
          endStepId: null,
          startRow: activation.startRow,
          endRow: null,
          startYOverride: null,
          endYOverride: null,
          depth: activation.depth,
        })
      }
    }

    // --- Phase 3: Register notes ---
    for (const marker of markers) {
      if (marker.kind !== 'note') continue
      const afterRow = marker.afterStep !== undefined ? (stepRowMap.get(marker.afterStep) ?? null) : null
      layout.registerNote({
        id: marker.id,
        placement: marker.placement,
        actors: marker.actors,
        text: marker.text,
        afterStepId: marker.afterStep ?? null,
        afterRow,
      })
    }
  }

  // Push each frame's first content row down so header band(s) have clear space above.
  layout.finalizeFrameConstraints()

  // Push rows that follow a note down so the next step's label clears the note box.
  // Uses LABEL_OFFSET from const.ts (must match SequenceStepEdge.tsx LABEL_OFFSET = 16).
  layout.finalizeNoteConstraints()

  const bounds = layout.getViewBounds()

  const compounds = pipe(
    layout.getCompoundBoxes(),
    map(({ node, ...box }) => ({ ...box, id: node.id, origin: node.id })),
    groupByProp('id'),
    mapValues((boxes, id) => {
      if (hasAtLeast(boxes, 2)) {
        return map(boxes, (box, i) => ({ ...box, id: `${id}-${i + 1}` as NodeId }))
      }
      return boxes
    }),
    values(),
    flat(),
  )

  return {
    actors: actors.map(actor => toSeqActor({ actor, ports: actorPorts.get(actor), layout })),
    compounds,
    steps: map(steps, s => ({
      id: s.id,
      sourceHandle: s.id + '_source',
      targetHandle: s.id + '_target',
      ...s.label && ({
        labelBBox: {
          width: s.label.width,
          height: s.label.height,
        },
      }),
    })),
    // When the new control-flow `frames` are present, they already render `parallel`
    // blocks (kind 'parallel'). The legacy parallel rectangles would double-render —
    // and worse, `getParallelStepsPrefix` mis-groups every nested step id
    // (e.g. `step-03.alt.1.2`) into a spurious parallel rect. Suppress them here so
    // only pure-legacy views (old flat `parallel { stepA stepB }`, no frames) draw them.
    // NOTE: frames may arrive via `computedView` OR via `view.frames` (the layouted
    // view) — the CLI/graphviz path passes only the latter — so use the same fallback
    // as the frame-registration phase above (`computedView?.frames ?? view.frames`).
    parallelAreas: ((computedView?.frames ?? view.frames)?.length ?? 0) > 0 ? [] : layout.getParallelBoxes(),
    frames: layout.getFrameBoxes(),
    activations: layout.getActivations(),
    notes: layout.getNotes(),
    bounds,
  }
}

function toSeqActor({ actor, ports, layout }: {
  actor: DiagramNode
  ports: Port[]
  layout: SequenceViewLayouter
}): SequenceActor {
  const { x, y, width, height } = layout.getActorBox(actor)
  return {
    id: actor.id,
    x,
    y,
    width,
    height,
    ports: ports.map((p): SequenceActorStepPort => {
      const bbox = layout.getPortCenter(p.step, p.type)
      return ({
        id: `${p.step.id}_${p.type}`,
        cx: bbox.cx - x,
        cy: bbox.cy - y,
        height: bbox.height,
        type: p.type,
        position: p.position,
      })
    }),
  }
}
