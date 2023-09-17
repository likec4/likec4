import type { SetStateAction } from 'jotai'
import { atom } from 'jotai'
import { equals } from 'rambdax'
import type { DiagramEdge, DiagramNode } from '../types'
import { selectAtom } from 'jotai/utils'

// const prevTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(
//   undefined
// )

// // DO NOT EXPORT currentValueAtom as using this atom to set state can cause
// // inconsistent state between currentValueAtom and debouncedValueAtom
// const _currentValueAtom = atom(initialValue)
// const isDebouncingAtom = atom(false)

// const debouncedValueAtom = atom(
//   initialValue,
//   (get, set, update: SetStateAction<T>) => {
//     clearTimeout(get(prevTimeoutAtom))

//     const prevValue = get(_currentValueAtom)
//     const nextValue =
//       typeof update === 'function'
//         ? (update as (prev: T) => T)(prevValue)
//         : update

//     const onDebounceStart = () => {
//       set(_currentValueAtom, nextValue)
//       set(isDebouncingAtom, true)
//     }

//     const onDebounceEnd = () => {
//       set(debouncedValueAtom, nextValue)
//       set(isDebouncingAtom, false)
//     }

//     onDebounceStart()

//     if (!shouldDebounceOnReset && nextValue === initialValue) {
//       onDebounceEnd()
//       return
//     }

//     const nextTimeoutId = setTimeout(() => {
//       onDebounceEnd()
//     }, delayMilliseconds)

//     // set previous timeout atom in case it needs to get cleared
//     set(prevTimeoutAtom, nextTimeoutId)
//   }ll)
// )

// // exported atom setter to clear timeout if needed
// const clearTimeoutAtom = atom(null, (get, set, _arg) => {
//   clearTimeout(get(prevTimeoutAtom))
//   set(isDebouncingAtom, false)
// })

// return {
//   currentValueAtom: atom((get) => get(_currentValueAtom)),
//   isDebouncingAtom,
//   clearTimeoutAtom,
//   debouncedValueAtom,
// }
// }

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
    if (_next == null && _prev != null) {
      const nextTimeoutId = setTimeout(() => {
        set(currentHoveredNodeAtom, null)
      }, 150)
      // set previous timeout atom in case it needs to get cleared
      set(nodeTimeoutAtom, nextTimeoutId)
    } else {
      set(currentHoveredNodeAtom, _next)
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
    clearTimeout(get(edgeTimeoutAtom))
    const _prev = get(currentHoveredEdgeAtom)
    const _next = typeof update === 'function' ? update(_prev) : update
    if (equals(_prev, _next)) {
      return false
    }
    if (_next == null && _prev != null) {
      const nextTimeoutId = setTimeout(() => {
        set(currentHoveredEdgeAtom, null)
      }, 150)
      // set previous timeout atom in case it needs to get cleared
      set(nodeTimeoutAtom, nextTimeoutId)
    } else {
      set(currentHoveredEdgeAtom, _next)
    }
    return true
  }
)

export const hoveredEdgeIdAtom = selectAtom(hoveredEdgeAtom, edge => edge?.id ?? null)
