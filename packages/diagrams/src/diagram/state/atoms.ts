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
    clearTimeout(get(edgeTimeoutAtom))
    const _prev = get(currentHoveredNodeAtom)
    const _next = typeof update === 'function' ? update(_prev) : update
    if (equals(_prev, _next)) {
      return false
    }
    if (_next != null) {
      if (_prev == null) {
        set(
          nodeTimeoutAtom,
          setTimeout(() => {
            set(currentHoveredNodeAtom, _next)
            set(currentHoveredEdgeAtom, null)
          }, 175)
        )
      } else {
        // Update node if it's already hovered
        set(
          nodeTimeoutAtom,
          setTimeout(() => {
            set(currentHoveredNodeAtom, _next)
            set(currentHoveredEdgeAtom, null)
          }, 120)
        )
      }
      return true
    }
    if (_prev != null) {
      // set previous timeout atom in case it needs to get cleared
      set(
        nodeTimeoutAtom,
        setTimeout(() => {
          set(currentHoveredNodeAtom, null)
        }, 175)
      )
      return true
    }
    return true
  }
)

export const hoveredNodeIdAtom = selectAtom(hoveredNodeAtom, node => node?.id ?? null)

const currentHoveredEdgeAtom = atom<HoveredEdge>(null)
const edgeTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(undefined)

export const hoveredEdgeAtom = atom(
  get => get(currentHoveredEdgeAtom),
  (get, set, update: SetStateAction<HoveredEdge>) => {
    clearTimeout(get(nodeTimeoutAtom))
    clearTimeout(get(edgeTimeoutAtom))
    const _prev = get(currentHoveredEdgeAtom)
    const _next = typeof update === 'function' ? update(_prev) : update
    if (equals(_prev, _next)) {
      return false
    }
    if (_next != null) {
      // set previous timeout atom in case it needs to get cleared
      if (_prev == null) {
        set(
          edgeTimeoutAtom,
          setTimeout(() => {
            set(currentHoveredEdgeAtom, _next)
            set(currentHoveredNodeAtom, null)
          }, 300)
        )
      } else {
        // Update edge if it's already hovered
        set(
          edgeTimeoutAtom,
          setTimeout(() => {
            set(currentHoveredEdgeAtom, _next)
            set(currentHoveredNodeAtom, null)
          }, 120)
        )
      }
      return true
    }
    if (_prev != null) {
      // set previous timeout atom in case it needs to get cleared
      set(
        edgeTimeoutAtom,
        setTimeout(() => {
          set(currentHoveredEdgeAtom, null)
        }, 175)
      )
      return true
    }
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
