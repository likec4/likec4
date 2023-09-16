import type { SetStateAction } from 'jotai'
import { atom } from 'jotai'
import { equals } from 'rambdax'
import type { DiagramNode } from '../types'

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
const currentHoveredNodeAtom = atom<HoveredNode>(null)
const prevTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(undefined)

export const hoveredNodeAtom = atom(
  get => get(currentHoveredNodeAtom),
  (get, set, update: SetStateAction<HoveredNode>) => {
    clearTimeout(get(prevTimeoutAtom))
    const _prev = get(currentHoveredNodeAtom)
    const _next = typeof update === 'function' ? update(_prev) : update
    if (equals(_prev, _next)) {
      return false
    }
    set(currentHoveredNodeAtom, _next)
    // if (_next == null && _prev != null) {
    //   const nextTimeoutId = setTimeout(() => {
    //     set(currentHoveredNodeAtom, null)
    //   }, 120)
    //   // set previous timeout atom in case it needs to get cleared
    //   set(prevTimeoutAtom, nextTimeoutId)
    // } else {
    //   set(currentHoveredNodeAtom, _next)
    // }
    // return true
  }
)
