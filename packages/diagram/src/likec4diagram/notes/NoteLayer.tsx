// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { RichText } from '@likec4/core'
import { type Point, convertPoint } from '@likec4/core/geometry'
import type { BBox, scalar, ViewId, XYPoint } from '@likec4/core/types'
import { ViewportPortal } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useEnabledFeatures } from '../../context/DiagramFeatures'
import { useRootContainer } from '../../context/RootContainerContext'
import { useCallbackRef } from '../../hooks/useCallbackRef'
import { useDiagram } from '../../hooks/useDiagram'
import { useEditorActorRef } from '../../hooks/useEditorActor'
import { useXYStore, useXYStoreApi } from '../../hooks/useXYFlow'
import type { Types } from '../types'
import {
  type NotePlacementResult,
  type NoteSegment,
  type NoteTarget,
  compoundFrameObstacles,
  NOTE_TARGET_DOT_RADIUS,
  placeNoteCards,
} from './geometry'
import { NoteCard } from './NoteCard'

type Note = {
  id: string
  kind: 'node' | 'edge'
  label: string
  notes: scalar.MarkdownOrString
}

type EdgeRoute = { anchor: XYPoint; tangent?: XYPoint; segments: NoteSegment[] }

function hasNotes(notes: scalar.MarkdownOrString | null | undefined): notes is scalar.MarkdownOrString {
  return RichText.from(notes).nonEmpty
}

function midpoint(points: readonly Point[]): XYPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  return convertPoint(points[Math.floor((points.length - 1) / 2)]!)
}

function nearestBoundaryPoint(box: BBox, point: XYPoint): XYPoint {
  const x = Math.max(box.x, Math.min(point.x, box.x + box.width))
  const y = Math.max(box.y, Math.min(point.y, box.y + box.height))
  if (x !== point.x || y !== point.y) return { x, y }
  const distances = [
    { distance: x - box.x, point: { x: box.x, y } },
    { distance: box.x + box.width - x, point: { x: box.x + box.width, y } },
    { distance: y - box.y, point: { x, y: box.y } },
    { distance: box.y + box.height - y, point: { x, y: box.y + box.height } },
  ]
  return distances.reduce((best, next) => next.distance < best.distance ? next : best).point
}

/** A presentation layer in the transformed viewport. It does not add layout nodes. */
export function NoteLayer({
  viewId,
  variant,
  architectureBounds,
  nodes,
  edges,
  onContentBoundsChange,
}: {
  viewId: ViewId
  variant: 'diagram' | 'sequence'
  architectureBounds: BBox
  nodes: Types.Node[]
  edges: Types.Edge[]
  onContentBoundsChange?: ((value: { viewId: ViewId; bounds: BBox; ready: boolean }) => void) | undefined
}) {
  const { enableNotes } = useEnabledFeatures()
  const notifyContentBounds = useCallbackRef(onContentBoundsChange)
  const diagram = useDiagram()
  const editor = useEditorActorRef()
  const editingEdge = useSyncExternalStore(
    useCallback(listener => {
      const subscription = editor?.subscribe(listener)
      return () => subscription?.unsubscribe()
    }, [editor]),
    useCallback(() => editor?.getSnapshot().context.editing?.subject === 'edge' || false, [editor]),
    () => false,
  )
  const active = enableNotes && variant === 'diagram'
  const { ref: rootRef } = useRootContainer()
  const xystore = useXYStoreApi()
  const xyNodes = useXYStore(state => state.nodes)
  const dragging = xyNodes.some(node => node.dragging) || editingEdge
  const [measurement, setMeasurement] = useState<{
    key: string
    sizes: Record<string, { width: number; height: number }>
    imagesReady: boolean
  }>({ key: '', sizes: {}, imagesReady: false })
  const [fontsReadyKey, setFontsReadyKey] = useState<string | null>(null)
  const [pathVersion, setPathVersion] = useState(0)
  const [routes, setRoutes] = useState<{ key: string; byId: Record<string, EdgeRoute> }>({ key: '', byId: {} })
  const [settled, setSettled] = useState<{ key: string; result: NotePlacementResult } | null>(null)
  const cardElements = useMemo(() => new Map<string, HTMLDivElement>(), [])

  const notes = useMemo<Note[]>(() => {
    if (!active) return []
    const visibleNodes = new Set(nodes.filter(node => !node.hidden).map(node => node.id))
    const nodeTitles = new Map(nodes.map(node => [node.id, node.data.title || node.id]))
    return [
      ...nodes.filter(node => !node.hidden && hasNotes(node.data.notes)).map(node => ({
        id: node.id,
        kind: 'node' as const,
        label: node.data.title,
        notes: node.data.notes!,
      })),
      ...edges.filter(edge =>
        !edge.hidden && edge.type === 'relationship' && visibleNodes.has(edge.source)
        && visibleNodes.has(edge.target) && hasNotes(edge.data.notes)
      ).map(
        edge => ({
          id: edge.id,
          kind: 'edge' as const,
          label: `${nodeTitles.get(edge.source) ?? edge.source} to ${nodeTitles.get(edge.target) ?? edge.target}`
            + (edge.data.label ? `: ${edge.data.label}` : ''),
          notes: edge.data.notes!,
        }),
      ),
    ]
  }, [active, nodes, edges])

  const noteKey = JSON.stringify([viewId, notes.map(note => [note.kind, note.id, note.notes])])
  const routeKey = JSON.stringify([viewId, pathVersion, edges.map(edge => [edge.id, edge.hidden])])
  const measure = useCallback(() => {
    const next: Record<string, { width: number; height: number }> = {}
    for (const note of notes) {
      const element = cardElements.get(note.id)
      if (element) {
        next[note.id] = { width: element.offsetWidth, height: element.offsetHeight }
      }
    }
    const imagesReady = notes.every(note => {
      const element = cardElements.get(note.id)
      return !!element && Array.from(element.querySelectorAll('img')).every(image => image.complete)
    })
    setMeasurement(previous =>
      previous.key === noteKey
        && previous.imagesReady === imagesReady
        && JSON.stringify(previous.sizes) === JSON.stringify(next)
        ? previous
        : { key: noteKey, sizes: next, imagesReady }
    )
  }, [cardElements, noteKey, notes])

  useEffect(() => {
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) {
        setFontsReadyKey(noteKey)
      }
    })
    return () => {
      cancelled = true
    }
  }, [noteKey])

  useEffect(() => {
    if (notes.length === 0) return
    const observer = new ResizeObserver(measure)
    for (const element of cardElements.values()) observer.observe(element)
    const frame = requestAnimationFrame(measure)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [cardElements, measure, notes.length])

  useEffect(() => {
    const root = rootRef.current
    if (!active || !root || notes.length === 0 || edges.length === 0) return
    let frame = 0
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setPathVersion(version => version + 1))
    })
    const paths = root.querySelector('.react-flow__edges')
    if (paths) {
      observer.observe(paths, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'd'] })
    }
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [active, edges, notes.length, rootRef])

  useEffect(() => {
    if (!active || notes.length === 0) return
    const frame = requestAnimationFrame(() => {
      const renderedEdges = Array.from(
        rootRef.current?.querySelectorAll<SVGGElement>('.react-flow__edge[data-id]') ?? [],
      )
      const byId: Record<string, EdgeRoute> = {}
      for (const edge of edges) {
        if (edge.hidden || edge.type !== 'relationship') continue
        const edgeElement = renderedEdges.find(element => element.dataset['id'] === edge.id)
        const path = edgeElement?.querySelector<SVGPathElement>('.react-flow__edge-path')
        const length = path && typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0
        const segments: NoteSegment[] = []
        if (path && length > 0) {
          let previous = path.getPointAtLength(0)
          for (let index = 1; index <= 20; index++) {
            const point = path.getPointAtLength(length * index / 20)
            segments.push({ from: previous, to: point, ownerId: edge.id })
            previous = point
          }
        } else {
          for (let index = 1; index < edge.data.points.length; index++) {
            segments.push({
              from: convertPoint(edge.data.points[index - 1]!),
              to: convertPoint(edge.data.points[index]!),
              ownerId: edge.id,
            })
          }
        }
        const anchor = path && length > 0 ? path.getPointAtLength(length / 2) : midpoint(edge.data.points)
        let tangent: XYPoint | undefined
        if (path && length > 0) {
          const before = path.getPointAtLength(length * 0.49)
          const after = path.getPointAtLength(length * 0.51)
          tangent = { x: after.x - before.x, y: after.y - before.y }
        }
        byId[edge.id] = { anchor, ...(tangent && { tangent }), segments }
      }
      setRoutes({ key: routeKey, byId })
    })
    return () => cancelAnimationFrame(frame)
  }, [active, notes.length, edges, routeKey, rootRef])

  const measured = measurement.key === noteKey && notes.every(note => (measurement.sizes[note.id]?.height ?? 0) > 0)
  const sizes = measurement.sizes
  const targets: NoteTarget[] = []
  const obstacles: { bounds: BBox; ownerId?: string }[] = []
  const segments: { from: XYPoint; to: XYPoint; ownerId?: string }[] = []
  if (active && measured) {
    const state = xystore.getState()
    const visibleNodes = new Set(nodes.filter(node => !node.hidden).map(node => node.id))
    for (const node of nodes) {
      if (node.hidden) continue
      const internal = state.nodeLookup.get(node.id)
      const position = internal?.internals.positionAbsolute ?? node.data
      const bounds = {
        x: position.x,
        y: position.y,
        width: internal?.measured?.width ?? node.measured?.width ?? node.initialWidth ?? 0,
        height: internal?.measured?.height ?? node.measured?.height ?? node.initialHeight ?? 0,
      }
      if (node.type?.startsWith('compound-') || node.type === 'view-group') {
        obstacles.push(...compoundFrameObstacles(bounds, node.id))
      } else {
        obstacles.push({ bounds, ownerId: node.id })
      }
      const size = sizes[node.id]
      if (size && hasNotes(node.data.notes)) {
        targets.push({ id: node.id, kind: 'node', bounds, size })
      }
    }
    for (const edge of edges) {
      if (
        edge.hidden || edge.type !== 'relationship' || !visibleNodes.has(edge.source)
        || !visibleNodes.has(edge.target)
      ) continue
      const route = routes.key === routeKey ? routes.byId[edge.id] : undefined
      if (route) segments.push(...route.segments)
      if (edge.data.labelBBox) {
        obstacles.push({ bounds: edge.data.labelBBox })
      }
      if (!hasNotes(edge.data.notes)) continue
      const size = sizes[edge.id]
      if (!size) continue
      targets.push({
        id: edge.id,
        kind: 'edge',
        anchor: route?.anchor ?? midpoint(edge.data.points),
        ...(route?.tangent && { tangent: route.tangent }),
        size,
      })
    }
  }
  // Read these subscriptions when node positions or the rendered edge path changes.
  void xyNodes
  const result = active && measured
    ? placeNoteCards({ architectureBounds, targets, obstacles, segments })
    : null
  const resultKey = JSON.stringify(result)
  useEffect(() => {
    if (dragging || !result) return
    const frame = requestAnimationFrame(() => {
      setSettled(previous =>
        previous?.key === noteKey && JSON.stringify(previous.result) === resultKey
          ? previous
          : { key: noteKey, result }
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [dragging, noteKey, resultKey])
  const stableResult = settled?.key === noteKey ? settled.result : null
  const displayResult = dragging && stableResult
    ? {
      ...stableResult,
      placements: stableResult.placements.map(placed => {
        const target = targets.find(candidate => candidate.id === placed.id)
        if (!target) return placed
        const center = { x: placed.bounds.x + placed.bounds.width / 2, y: placed.bounds.y + placed.bounds.height / 2 }
        const anchor = target.kind === 'node'
          ? nearestBoundaryPoint(target.bounds, center)
          : target.anchor
        return {
          ...placed,
          leader: { from: nearestBoundaryPoint(placed.bounds, anchor), to: anchor },
        }
      }),
    }
    : result
  const placementReady = !active || notes.length === 0 ||
    (measured && fontsReadyKey === noteKey &&
      (routes.key === routeKey || (dragging && !!stableResult)) && !!displayResult)
  const ready = placementReady && (!active || notes.length === 0 || measurement.imagesReady)
  const bounds = displayResult?.bounds ?? architectureBounds

  useEffect(() => {
    if (dragging) return
    if (active && notes.length > 0 && !placementReady) return
    diagram.send({
      type: 'notes.bounds',
      viewId,
      bounds: active && notes.length > 0 && displayResult ? displayResult.bounds : null,
    })
  }, [diagram, viewId, active, notes.length, placementReady, dragging, bounds.x, bounds.y, bounds.width, bounds.height])

  useEffect(() => {
    notifyContentBounds({ viewId, bounds, ready })
  }, [viewId, bounds.x, bounds.y, bounds.width, bounds.height, ready, notifyContentBounds])

  const placements = new Map(displayResult?.placements.map(placed => [placed.id, placed]) ?? [])
  return (
    <ViewportPortal>
      <svg
        aria-hidden="true"
        data-likec4-note-leaders
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 299 }}
      >
        {placementReady && displayResult?.placements.map(placed => (
          <g key={placed.id} data-note-target={placed.id}>
            <line
              x1={placed.leader.from.x}
              y1={placed.leader.from.y}
              x2={placed.leader.to.x}
              y2={placed.leader.to.y}
              stroke="var(--mantine-color-yellow-7)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <circle
              cx={placed.leader.to.x}
              cy={placed.leader.to.y}
              r={NOTE_TARGET_DOT_RADIUS}
              fill="var(--mantine-color-yellow-7)"
            />
          </g>
        ))}
      </svg>
      {notes.map(note => {
        const placement = placements.get(note.id)
        return (
          <NoteCard
            key={`${note.kind}:${note.id}`}
            id={note.id}
            label={note.label}
            notes={note.notes}
            measureRef={element => {
              if (element) cardElements.set(note.id, element)
              else cardElements.delete(note.id)
            }}
            onContentSettled={measure}
            style={{
              left: placement?.bounds.x ?? 0,
              top: placement?.bounds.y ?? 0,
              visibility: placementReady && placement ? 'visible' : 'hidden',
            }}
          />
        )
      })}
    </ViewportPortal>
  )
}
