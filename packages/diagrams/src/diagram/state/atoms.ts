import type { SetStateAction, Setter } from 'jotai'
import { atom } from 'jotai'
import { equals } from 'rambdax'
import type { DiagramEdge, DiagramNode } from '../types'
import { selectAtom } from 'jotai/utils'

type HoveredNode = DiagramNode | null
type HoveredEdge = DiagramEdge | null
const currentHoveredNodeAtom = atom<HoveredNode>(null)
const nodeTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(undefined)

const scheduleHoveredNode = (set: Setter, node: HoveredNode = null, timeout = 175) => {
  if (timeout <= 0) {
    set(currentHoveredNodeAtom, node)
    return
  }
  set(
    nodeTimeoutAtom,
    setTimeout(() => {
      set(currentHoveredNodeAtom, node)
    }, timeout)
  )
}

export const hoveredNodeAtom = atom(
  get => get(currentHoveredNodeAtom),
  (get, set, update: SetStateAction<HoveredNode>) => {
    clearTimeout(get(nodeTimeoutAtom))
    const _prev = get(currentHoveredNodeAtom)
    const _next = typeof update === 'function' ? update(_prev) : update
    if (equals(_prev, _next)) {
      return false
    }
    // update faster if there is one already hovered
    const timeout = !!_next && !!_prev ? 120 : 175
    if (_next != null) {
      // clean hovered edge
      clearTimeout(get(edgeTimeoutAtom))
      scheduleHoveredEdge(set, null, timeout)
    }
    scheduleHoveredNode(set, _next, timeout)
    return true
  }
)

export const hoveredNodeIdAtom = selectAtom(hoveredNodeAtom, node => node?.id ?? null)

const currentHoveredEdgeAtom = atom<HoveredEdge>(null)
const edgeTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(undefined)

const scheduleHoveredEdge = (set: Setter, edge: HoveredEdge = null, timeout = 175) => {
  if (timeout <= 0) {
    set(currentHoveredEdgeAtom, edge)
    return
  }
  set(
    edgeTimeoutAtom,
    setTimeout(() => {
      set(currentHoveredEdgeAtom, edge)
    }, timeout)
  )
}

export const hoveredEdgeAtom = atom(
  get => get(currentHoveredEdgeAtom),
  (get, set, update: SetStateAction<HoveredEdge>) => {
    clearTimeout(get(edgeTimeoutAtom))
    const _prev = get(currentHoveredEdgeAtom)
    const _next = typeof update === 'function' ? update(_prev) : update
    if (equals(_prev, _next)) {
      return false
    }
    let timeout = 175
    if (_next != null) {
      // update faster if there is one already hovered
      timeout = _prev != null ? 120 : 300
      // clean hovered node
      clearTimeout(get(nodeTimeoutAtom))
      scheduleHoveredNode(set, null, timeout)
    }
    scheduleHoveredEdge(set, _next, timeout)
    return true
  }
)

export const hoveredEdgeIdAtom = selectAtom(hoveredEdgeAtom, edge => edge?.id ?? null)

export const resetHoveredStatesAtom = atom(undefined, (get, set) => {
  clearTimeout(get(nodeTimeoutAtom))
  clearTimeout(get(edgeTimeoutAtom))
  set(currentHoveredNodeAtom, null)
  set(currentHoveredEdgeAtom, null)
})
