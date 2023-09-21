import type { SetStateAction } from 'jotai'
import { atom } from 'jotai'
import { equals } from 'rambdax'
import type { DiagramEdge, DiagramNode } from '../types'
import { selectAtom } from 'jotai/utils'

type HoveredNode = DiagramNode | null
type HoveredEdge = DiagramEdge | null
const currentHoveredNodeAtom = atom<HoveredNode>(null)
const nodeTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(undefined)

export const hoveredNodeAtom = atom(
  get => get(currentHoveredNodeAtom),
  (get, set, update: SetStateAction<HoveredNode>) => {
    clearTimeout(get(nodeTimeoutAtom))
    const _prev = get(currentHoveredNodeAtom)
    const _next = typeof update === 'function' ? update(_prev) : update
    if (equals(_prev, _next)) {
      return false
    }
    if (_next != null && _prev == null) {
      set(
        nodeTimeoutAtom,
        setTimeout(() => {
          set(currentHoveredNodeAtom, _next)
        }, 180)
      )
      return true
    }
    if (_next == null && _prev != null) {
      // set previous timeout atom in case it needs to get cleared
      set(
        nodeTimeoutAtom,
        setTimeout(() => {
          set(currentHoveredNodeAtom, null)
        }, 180)
      )
      return true
    }
    set(currentHoveredNodeAtom, _next)
    return true
  }
)

export const hoveredNodeIdAtom = selectAtom(hoveredNodeAtom, node => node?.id ?? null)

const currentHoveredEdgeAtom = atom<HoveredEdge>(null)
const edgeTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(undefined)

export const hoveredEdgeAtom = atom(
  get => get(currentHoveredEdgeAtom),
  (get, set, update: SetStateAction<HoveredEdge>) => {
    clearTimeout(get(edgeTimeoutAtom))
    const _prev = get(currentHoveredEdgeAtom)
    const _next = typeof update === 'function' ? update(_prev) : update
    if (equals(_prev, _next)) {
      return false
    }
    if (_next != null && _prev == null) {
      // set previous timeout atom in case it needs to get cleared
      set(
        edgeTimeoutAtom,
        setTimeout(() => {
          set(currentHoveredEdgeAtom, _next)
        }, 180)
      )
      return true
    }
    if (_next == null && _prev != null) {
      // set previous timeout atom in case it needs to get cleared
      set(
        edgeTimeoutAtom,
        setTimeout(() => {
          set(currentHoveredEdgeAtom, null)
        }, 180)
      )
      return true
    }
    set(currentHoveredEdgeAtom, _next)
    return true
  }
)

export const hoveredEdgeIdAtom = selectAtom(hoveredEdgeAtom, edge => edge?.id ?? null)
