import type { LikeC4ViewModel } from '@likec4/core/model'
import type { ComputedDynamicView, ComputedEdge, ComputedFrame, ComputedMarker, ComputedNode } from '@likec4/core/types'
import type { aux } from '@likec4/core/types'
import { CompositeGeneratorNode, NL, toString } from 'langium/generate'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const capitalizeFirstLetter = (value: string): string => value.charAt(0).toLocaleUpperCase() + value.slice(1)

const fqnName = (nodeId: string): string => nodeId.split('.').map(capitalizeFirstLetter).join('')

/** Resolve a participant name from a node id string. */
const actorName = (nodeId: string): string => fqnName(nodeId)

/**
 * Escape Mermaid message text: replace literal `:` with HTML entity and
 * convert newlines to `<br/>`.
 */
const escapeLabel = (label: string): string => label.replace(/:/g, '&#58;').replace(/\r?\n/g, '<br/>')

/** Choose the arrow characters based on edge attributes. */
const arrowFor = (edge: ComputedEdge): string => {
  const isDashed = edge.line === 'dashed'
  const isOpen = edge.head === 'open'
  const isBack = edge.dir === 'back'

  if (isBack) {
    return isDashed ? '-->>' : '->>' // Mermaid has no true "back" arrow; emit reverse order instead (handled at call site)
  }
  if (isOpen) {
    return isDashed ? '-->' : '->'
  }
  return isDashed ? '-->>' : '->>'
}

/**
 * Emit one sequence step line.
 * For `dir === 'back'`, swap source/target so the arrow flows right-to-left
 * (Mermaid renders `B->>A:` as an arrow pointing from B to A).
 */
const emitStep = (edge: ComputedEdge, node: CompositeGeneratorNode): void => {
  const isBack = edge.dir === 'back'
  const from = actorName(isBack ? edge.target : edge.source)
  const to = actorName(isBack ? edge.source : edge.target)
  const arrow = arrowFor(edge)
  const label = edge.label ? escapeLabel(edge.label) : ''
  node.append(from, arrow, to, ': ', label, NL)
}

/** Emit a single marker line. */
const emitMarker = (
  marker: ComputedMarker,
  node: CompositeGeneratorNode,
): void => {
  switch (marker.kind) {
    case 'note': {
      const actors = marker.actors.map(a => actorName(a)).join(',')
      switch (marker.placement) {
        case 'over':
          node.append(`Note over ${actors}: ${escapeLabel(marker.text)}`, NL)
          break
        case 'left':
          node.append(`Note left of ${actors}: ${escapeLabel(marker.text)}`, NL)
          break
        case 'right':
          node.append(`Note right of ${actors}: ${escapeLabel(marker.text)}`, NL)
          break
      }
      break
    }
    case 'activate':
      node.append(`activate ${actorName(marker.actor)}`, NL)
      break
    case 'deactivate':
      node.append(`deactivate ${actorName(marker.actor)}`, NL)
      break
    case 'create':
      node.append(`create participant ${actorName(marker.actor)}`, NL)
      break
    case 'destroy':
      node.append(`destroy ${actorName(marker.actor)}`, NL)
      break
  }
}

// ---------------------------------------------------------------------------
// Frame-keyword mapping
// ---------------------------------------------------------------------------

type FrameKind = ComputedFrame['kind']

const frameOpenKeyword = (kind: FrameKind, label?: string, condition?: string): string => {
  const text = condition ?? label ?? ''
  switch (kind) {
    case 'if':
      return `alt ${text}`
    case 'optional':
      return `opt ${text}`
    case 'repeat':
      return `loop ${text}`
    case 'parallel':
      return `par`
    case 'group':
      return `rect rgb(220, 220, 250)`
    case 'critical':
      return `critical ${text}`
    case 'break':
      return `break ${text}`
  }
}

const frameBranchSeparator = (kind: FrameKind, label?: string, condition?: string): string => {
  const text = condition ?? label ?? ''
  switch (kind) {
    case 'if':
      return `else ${text}`
    case 'parallel':
      return `and ${text}`
    case 'critical':
      return `option ${text}`
    default:
      return `else ${text}`
  }
}

// ---------------------------------------------------------------------------
// Linearisation strategy (two-pass)
//
// Pass 1: build a lookup map  stepId → frameId  for every step that is inside
//         any frame branch.  Steps not in any frame are "top-level".
//
// Pass 2: walk the flat `edges` array in order.  Whenever we encounter the
//         FIRST step of a frame branch, emit the frame-open keyword (or a
//         branch-separator when moving to the next branch of the same frame).
//         After the LAST step of the last branch, emit `end`.  Nested frames
//         are handled by recursion — each frame's branches' stepIds are walked
//         from the already-sorted edges array.
//
// This approach is simple, deterministic, and handles arbitrary nesting
// because frame membership is resolved by index into the flat edge array.
// ---------------------------------------------------------------------------

type StepIndex = number // position in view.edges

interface BranchMeta {
  frameId: string
  branchIndex: number
  firstStepIdx: StepIndex
  lastStepIdx: StepIndex
  label: string | undefined
  condition: string | undefined
  markerIds: ReadonlyArray<string>
}

interface FrameMeta {
  frame: ComputedFrame
  branches: BranchMeta[]
  firstStepIdx: StepIndex
  lastStepIdx: StepIndex
}

function buildFrameMetaMap(
  view: ComputedDynamicView,
  edgeIndexMap: Map<string, number>,
): Map<string, FrameMeta> {
  const result = new Map<string, FrameMeta>()
  if (!view.frames) return result

  for (const frame of view.frames) {
    const branchMetas: BranchMeta[] = []
    let frameFirst = Infinity
    let frameLast = -Infinity

    for (let bi = 0; bi < frame.branches.length; bi++) {
      const branch = frame.branches[bi]!
      const indices = branch.stepIds
        .map(sid => edgeIndexMap.get(sid) ?? -1)
        .filter(i => i >= 0)
        .sort((a, b) => a - b)

      const first = indices.length > 0 ? (indices[0] ?? Infinity) : Infinity
      const last = indices.length > 0 ? (indices[indices.length - 1] ?? -Infinity) : -Infinity

      branchMetas.push({
        frameId: frame.id,
        branchIndex: bi,
        firstStepIdx: first,
        lastStepIdx: last,
        label: branch.label,
        condition: branch.condition,
        markerIds: branch.markerIds,
      })

      if (first < frameFirst) frameFirst = first
      if (last > frameLast) frameLast = last
    }

    result.set(frame.id, {
      frame,
      branches: branchMetas,
      firstStepIdx: frameFirst,
      lastStepIdx: frameLast,
    })
  }

  return result
}

/**
 * Build a map: stepId → set of frameIds whose branches contain this step.
 * Ordered by frame depth so inner frames take precedence.
 */
function buildStepToFrames(
  view: ComputedDynamicView,
): Map<string, string[]> {
  const result = new Map<string, string[]>()
  if (!view.frames) return result

  // Sort frames by depth descending so deepest frame is first in the list
  const sorted = [...view.frames].sort((a, b) => b.depth - a.depth)

  for (const frame of sorted) {
    for (const branch of frame.branches) {
      for (const sid of branch.stepIds) {
        if (!result.has(sid)) result.set(sid, [])
        result.get(sid)!.push(frame.id)
      }
    }
  }

  return result
}

/**
 * Build a map: markerId → ComputedMarker for quick lookup.
 */
function buildMarkerMap(view: ComputedDynamicView): Map<string, ComputedMarker> {
  const result = new Map<string, ComputedMarker>()
  if (!view.markers) return result
  for (const m of view.markers) {
    result.set(m.id, m)
  }
  return result
}

// ---------------------------------------------------------------------------
// Recursive body emitter
// ---------------------------------------------------------------------------

/**
 * Emit all content for a list of step-indices (from a single frame branch or
 * the top level), recursing into child frames as needed.
 *
 * @param stepIndices  - sorted indices into `view.edges` belonging to this scope
 * @param frameMetaMap - full frame metadata map
 * @param allStepToFrames - stepId → [frameId] map (deepest first)
 * @param view         - the computed dynamic view
 * @param edgeArray    - `view.edges` for index access
 * @param markerMap    - markerId → ComputedMarker
 * @param parentFrameId - the frame we are inside (undefined = top level)
 * @param out          - generator node to append to
 * @param depth        - current indentation depth
 */
function emitScope(
  stepIndices: number[],
  frameMetaMap: Map<string, FrameMeta>,
  allStepToFrames: Map<string, string[]>,
  view: ComputedDynamicView,
  edgeArray: ReadonlyArray<ComputedEdge>,
  markerMap: Map<string, ComputedMarker>,
  parentFrameId: string | undefined,
  out: CompositeGeneratorNode,
  indent: number,
  nodeTitleMap: Map<string, string>,
): void {
  // Among the child frames of parentFrameId, find which ones start within
  // our stepIndices range so we can open/close them at the right positions.
  const childFrames: FrameMeta[] = []
  for (const fm of frameMetaMap.values()) {
    if (fm.frame.parent === parentFrameId) {
      childFrames.push(fm)
    }
  }
  // Sort child frames by first-step index
  childFrames.sort((a, b) => a.firstStepIdx - b.firstStepIdx)

  let i = 0
  while (i < stepIndices.length) {
    const idx = stepIndices[i]!
    const edge = edgeArray[idx]!
    const stepId = edge.id

    // Check if this step is the first step of a direct child frame
    const childFrame = childFrames.find(fm => {
      const firstBranch = fm.branches[0]
      return firstBranch !== undefined && firstBranch.firstStepIdx === idx
    })

    if (childFrame) {
      const { frame, branches } = childFrame

      // Collect all step indices in this child frame
      const frameStepIndices = stepIndices.filter(
        si => si >= childFrame.firstStepIdx && si <= childFrame.lastStepIdx,
      )

      // Emit the open keyword
      const firstBranch = branches[0]!
      emitIndented(
        out,
        indent,
        frameOpenKeyword(frame.kind, frame.label ?? firstBranch.label, frame.condition ?? firstBranch.condition) + '\n',
      )

      // Emit branch content
      for (let bi = 0; bi < branches.length; bi++) {
        const branch = branches[bi]!

        // If not the first branch, emit a separator
        if (bi > 0) {
          emitIndented(out, indent, frameBranchSeparator(frame.kind, branch.label, branch.condition) + '\n')
        }

        // Collect step indices belonging to this branch
        const branchStepIndices = branch.firstStepIdx <= branch.lastStepIdx
          ? frameStepIndices.filter(
            si => si >= branch.firstStepIdx && si <= branch.lastStepIdx,
          )
          : []

        // Emit branch markers BEFORE steps (markers with afterStep === undefined belong at the start)
        for (const mid of branch.markerIds) {
          const marker = markerMap.get(mid)
          if (!marker) continue
          if (marker.afterStep === undefined) {
            emitMarkerIndented(marker, out, indent + 2, nodeTitleMap)
          }
        }

        // Recurse into branch content
        emitScope(
          branchStepIndices,
          frameMetaMap,
          allStepToFrames,
          view,
          edgeArray,
          markerMap,
          frame.id,
          out,
          indent + 2,
          nodeTitleMap,
        )

        // Emit branch markers AFTER their afterStep
        // (markers with afterStep inside this branch that haven't been emitted yet)
        for (const mid of branch.markerIds) {
          const marker = markerMap.get(mid)
          if (!marker) continue
          if (marker.afterStep !== undefined) {
            // afterStep should have been emitted inline; skip here to avoid double-emit
            // (already handled in emitScope's step loop below via the markersByAfterStep map)
          }
        }
      }

      emitIndented(out, indent, 'end\n')

      // Advance past all indices consumed by this child frame
      i = stepIndices.indexOf(childFrame.lastStepIdx, i) + 1
      if (i === 0) break // safety: indexOf returned -1 (shouldn't happen)
    } else {
      // Regular step — check it belongs to our scope (not swallowed by an inner child frame)
      const frameIds = allStepToFrames.get(stepId) ?? []
      const deepestOwner = frameIds[0] // deepest frame that owns this step

      // Only emit the step here if its deepest owner is our parentFrameId (or no owner for top-level)
      if (deepestOwner === parentFrameId) {
        emitStepIndented(edge, out, indent)

        // Emit any markers with afterStep === this stepId
        if (view.markers) {
          for (const marker of view.markers) {
            if (marker.afterStep === stepId) {
              emitMarkerIndented(marker, out, indent, nodeTitleMap)
            }
          }
        }
      }
      i++
    }
  }
}

function emitIndented(out: CompositeGeneratorNode, indentLevel: number, text: string): void {
  const lines = text.split('\n').filter(l => l.length > 0)
  for (const line of lines) {
    out.append(' '.repeat(indentLevel) + line, NL)
  }
}

function emitStepIndented(edge: ComputedEdge, out: CompositeGeneratorNode, indent: number): void {
  const isBack = edge.dir === 'back'
  const from = actorName(isBack ? edge.target : edge.source)
  const to = actorName(isBack ? edge.source : edge.target)
  const arrow = arrowFor(edge)
  const label = edge.label ? escapeLabel(edge.label) : ''
  out.append(' '.repeat(indent) + `${from}${arrow}${to}: ${label}`, NL)
}

function emitMarkerIndented(
  marker: ComputedMarker,
  out: CompositeGeneratorNode,
  indent: number,
  nodeTitleMap: Map<string, string>,
): void {
  const pad = ' '.repeat(indent)
  switch (marker.kind) {
    case 'note': {
      const actors = marker.actors.map(a => actorName(a)).join(',')
      switch (marker.placement) {
        case 'over':
          out.append(`${pad}Note over ${actors}: ${escapeLabel(marker.text)}`, NL)
          break
        case 'left':
          out.append(`${pad}Note left of ${actors}: ${escapeLabel(marker.text)}`, NL)
          break
        case 'right':
          out.append(`${pad}Note right of ${actors}: ${escapeLabel(marker.text)}`, NL)
          break
      }
      break
    }
    case 'activate':
      out.append(`${pad}activate ${actorName(marker.actor)}`, NL)
      break
    case 'deactivate':
      out.append(`${pad}deactivate ${actorName(marker.actor)}`, NL)
      break
    case 'create': {
      // Match the header convention `participant <FQN> as <title>` so subsequent
      // step lines (which reference the FQN) resolve to this declaration.
      const fqn = actorName(marker.actor)
      const title = nodeTitleMap.get(marker.actor) ?? fqn
      out.append(`${pad}create participant ${fqn} as ${title}`, NL)
      break
    }
    case 'destroy':
      out.append(`${pad}destroy ${actorName(marker.actor)}`, NL)
      break
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function generateMermaidSequence(viewmodel: LikeC4ViewModel<aux.Unknown>): string {
  const view = viewmodel.$view as ComputedDynamicView
  const { nodes, edges } = view

  // Build edge-index lookup (stepId → position in edges array)
  const edgeIndexMap = new Map<string, number>()
  for (let i = 0; i < edges.length; i++) {
    edgeIndexMap.set(edges[i]!.id, i)
  }

  // Build node-id → title lookup so `create participant <fqn> as <title>` matches header convention.
  const nodeTitleMap = new Map<string, string>()
  for (const node of nodes) {
    nodeTitleMap.set(node.id, node.title)
  }

  // Determine which actors are introduced via `create participant` so we skip
  // their default `participant` declaration in the header.
  const createdActors = new Set<string>()
  if (view.markers) {
    for (const m of view.markers) {
      if (m.kind === 'create') {
        createdActors.add(m.actor)
      }
    }
  }

  const markerMap = buildMarkerMap(view)
  const frameMetaMap = buildFrameMetaMap(view, edgeIndexMap)
  const stepToFrames = buildStepToFrames(view)

  const out = new CompositeGeneratorNode()

  // ---- Header ----
  out.append('sequenceDiagram', NL)

  // autonumber
  const an = view.autonumber
  if (an?.enabled) {
    if (an.start !== undefined && an.step !== undefined) {
      out.append(`autonumber ${an.start} ${an.step}`, NL)
    } else if (an.start !== undefined) {
      out.append(`autonumber ${an.start}`, NL)
    } else {
      out.append('autonumber', NL)
    }
  }

  // Participant declarations (skip actors introduced via `create`)
  for (const node of nodes) {
    if (!createdActors.has(node.id)) {
      out.append(`  participant ${actorName(node.id)} as ${node.title}`, NL)
    }
  }

  // Emit markers that have no afterStep and are not inside any frame branch
  // (i.e., top-level markers before any step)
  if (view.markers) {
    for (const marker of view.markers) {
      if (marker.afterStep === undefined) {
        // Check it's not in any frame branch's markerIds
        const inBranch = view.frames?.some(f => f.branches.some(b => b.markerIds.includes(marker.id))) ?? false
        if (!inBranch) {
          emitMarkerIndented(marker, out, 2, nodeTitleMap)
        }
      }
    }
  }

  // ---- Body ----
  // All top-level step indices (steps not owned by any frame at depth > 0
  // from the top — i.e., steps whose deepest frame owner is undefined or
  // whose frames are all rooted at top-level frames)
  const allIndices = edges.map((_, i) => i)

  emitScope(
    allIndices,
    frameMetaMap,
    stepToFrames,
    view,
    edges,
    markerMap,
    undefined,
    out,
    2,
    nodeTitleMap,
  )

  return toString(out)
}
