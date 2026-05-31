import type { LikeC4ViewModel } from '@likec4/core/model'
import type { ComputedDynamicView, ComputedEdge, ComputedFrame, ComputedMarker } from '@likec4/core/types'
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

/**
 * Choose the arrow characters from edge STYLE only (line + head).
 *
 * `edge.dir` is deliberately NOT consulted: it is a LikeC4 layout/geometry
 * attribute ("source column is right of target column"), not a semantic
 * sender/receiver reversal. Mermaid derives the visual arrow direction from
 * `source ->> target` plus participant declaration order on its own, so the
 * emitter must always render `source -> target` and never swap.
 */
const arrowFor = (edge: ComputedEdge): string => {
  const isDashed = edge.line === 'dashed'
  const isOpen = edge.head === 'open'
  if (isOpen) {
    return isDashed ? '-->' : '->'
  }
  return isDashed ? '-->>' : '->>'
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
      // Labeled `parallel { branch 'x' … }` → `par x`; legacy flat `parallel { … }` (no
      // branch label) → bare `par`. Mermaid `and`/`end` close it as usual.
      return text ? `par ${text}` : `par`
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
  markerDeepestFrameId: ReadonlyMap<string, string>,
  suppressed: ReadonlySet<string>,
  edgeIndexMap: Map<string, number>,
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

  // A marker belongs to EXACTLY ONE scope — its deepest enclosing frame (or top-level when it
  // has no frame). `branch.markerIds` is cumulative (a nested marker is also listed by every
  // ancestor branch), so scope membership must be decided by deepest owner, not by set
  // membership — otherwise an inner-frame marker is re-emitted at each enclosing scope.
  const ownedHere = (markerId: string): boolean =>
    !suppressed.has(markerId) && (markerDeepestFrameId.get(markerId) ?? undefined) === parentFrameId

  // Emit markers owned by THIS scope that are attached to `stepId` (afterStep === stepId).
  // This scoping prevents a top-level marker from leaking inside a frame just because its
  // `afterStep` happens to be the last step of a branch.
  const emitScopeMarkersAfterStep = (stepId: string): void => {
    if (!view.markers) return
    for (const marker of view.markers) {
      if (marker.afterStep === stepId && ownedHere(marker.id)) {
        emitMarkerIndented(marker, out, indent, nodeTitleMap)
      }
    }
  }

  // Hoist this scope's markers whose `afterStep` resolved to a step INSIDE a now-closed child
  // frame. They were authored at this (outer) scope, so they must appear AFTER the frame's
  // `end`, never inside it. Their afterStep step is never emitted in this scope's step loop
  // (its deepest owner is the child frame), so this is the only place they are emitted.
  const emitDeferredScopeMarkers = (lo: number, hi: number): void => {
    if (!view.markers) return
    const deferred = view.markers
      .map(m => ({ marker: m, at: m.afterStep !== undefined ? edgeIndexMap.get(m.afterStep) : undefined }))
      .filter(({ marker, at }) => at !== undefined && at >= lo && at <= hi && ownedHere(marker.id))
      .sort((a, b) => (a.at ?? 0) - (b.at ?? 0))
    for (const { marker } of deferred) {
      emitMarkerIndented(marker, out, indent, nodeTitleMap)
    }
  }

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

        // Emit this branch's OWN markers that have no afterStep (they belong at the branch
        // start). `deepest === frame.id` filters out markers that actually belong to a nested
        // child frame (cumulative markerIds would otherwise surface them here).
        for (const mid of branch.markerIds) {
          const marker = markerMap.get(mid)
          if (!marker) continue
          if (
            marker.afterStep === undefined && !suppressed.has(mid)
            && markerDeepestFrameId.get(mid) === frame.id
          ) {
            emitMarkerIndented(marker, out, indent + 2, nodeTitleMap)
          }
        }

        // Recurse into branch content. Scope membership is carried by `markerDeepestFrameId`,
        // so afterStep markers owned by this branch are emitted inline by the recursion's step
        // loop, and nested-frame markers by the deeper recursion.
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
          markerDeepestFrameId,
          suppressed,
          edgeIndexMap,
        )
      }

      emitIndented(out, indent, 'end\n')

      // Outer-scope markers authored after a step inside this frame go AFTER `end`.
      emitDeferredScopeMarkers(childFrame.firstStepIdx, childFrame.lastStepIdx)

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
        emitScopeMarkersAfterStep(stepId)
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
  // Always semantic sender → receiver. `edge.source`/`edge.target` are normalized
  // by the parser (`A <- B` is stored as source=B, target=A), so no swap is ever
  // needed; swapping on `edge.dir === 'back'` (geometry) would invert the message.
  const from = actorName(edge.source)
  const to = actorName(edge.target)
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

  // First edge index that references each actor (as source or target).
  const firstRefIndex = new Map<string, number>()
  edges.forEach((e, i) => {
    if (!firstRefIndex.has(e.source)) firstRefIndex.set(e.source, i)
    if (!firstRefIndex.has(e.target)) firstRefIndex.set(e.target, i)
  })

  // Build node-id → title lookup so `create participant <fqn> as <title>` matches header convention.
  const nodeTitleMap = new Map<string, string>()
  for (const node of nodes) {
    nodeTitleMap.set(node.id, node.title)
  }

  // Decide which create/destroy markers are valid Mermaid and which must be degraded.
  //  - `create participant X` is only legal when the creating message is the IMMEDIATELY
  //    following line and X does not already exist. We approximate that with
  //    `firstRef(X) === createAfterStepIndex + 1`. Otherwise X is auto-created by its first
  //    message and an explicit `create` would raise "actors with the same id" → suppress the
  //    marker and declare X normally in the header instead.
  //  - `destroy X` is only legal in Mermaid when a "destroying message" involving X is the
  //    IMMEDIATELY following line. LikeC4 `destroy` instead terminates X's lifeline after its
  //    last message, so a trailing message rarely exists → suppress unless one genuinely does.
  const suppressedMarkerIds = new Set<string>()
  if (view.markers) {
    for (const m of view.markers) {
      if (m.kind === 'create') {
        const afterIdx = m.afterStep !== undefined ? (edgeIndexMap.get(m.afterStep) ?? -1) : -1
        const firstRef = firstRefIndex.get(m.actor) ?? Infinity
        if (firstRef !== afterIdx + 1) suppressedMarkerIds.add(m.id)
      } else if (m.kind === 'destroy') {
        const afterIdx = m.afterStep !== undefined ? (edgeIndexMap.get(m.afterStep) ?? -1) : -1
        const next = edges[afterIdx + 1]
        const destroyingMsgFollows = next !== undefined && (next.source === m.actor || next.target === m.actor)
        if (!destroyingMsgFollows) suppressedMarkerIds.add(m.id)
      }
    }
  }

  // Actors introduced via a VALID `create` are excluded from the header (they appear via
  // `create participant`). Actors whose `create` was suppressed fall back to a header decl.
  const createdActors = new Set<string>()
  if (view.markers) {
    for (const m of view.markers) {
      if (m.kind === 'create' && !suppressedMarkerIds.has(m.id)) {
        createdActors.add(m.actor)
      }
    }
  }

  // Each marker's DEEPEST owning frame (absent = top-level). `branch.markerIds` is cumulative
  // (a nested marker is also listed by every ancestor branch), so ownership is resolved by
  // walking frames deepest-first and letting the first claimant win — the single source of
  // truth for marker scope, preventing re-emission at each enclosing scope.
  const markerDeepestFrameId = new Map<string, string>()
  if (view.frames) {
    const byDepthDesc = [...view.frames].sort((a, b) => b.depth - a.depth)
    for (const f of byDepthDesc) {
      for (const b of f.branches) {
        for (const mid of b.markerIds) {
          if (!markerDeepestFrameId.has(mid)) markerDeepestFrameId.set(mid, f.id)
        }
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

  // Emit top-level markers that have no afterStep (e.g. an `activate` before any step).
  // Top-level = no deepest frame owner.
  if (view.markers) {
    for (const marker of view.markers) {
      if (
        marker.afterStep === undefined && !markerDeepestFrameId.has(marker.id)
        && !suppressedMarkerIds.has(marker.id)
      ) {
        emitMarkerIndented(marker, out, 2, nodeTitleMap)
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
    markerDeepestFrameId,
    suppressedMarkerIds,
    edgeIndexMap,
  )

  return toString(out)
}
