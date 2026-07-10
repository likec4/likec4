import { type StoreSnapshot, shallowEqual } from '@xstate/store'

import { useSelector } from '@xstate/store-react'
import { createContext, useContext } from 'react'
import { hasAtLeast } from 'remeda'

import { useCallbackRef } from '../../../hooks/useCallbackRef'
import type { OutlineState, OutlineStore } from './state'

export const OutlineStoreContext = createContext(null as unknown as OutlineStore)

export function selectOutlineState<T>(
  selector: (state: OutlineState) => T,
): [
  selector: (snapshot: StoreSnapshot<OutlineState>) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
]
export function selectOutlineState<T>(
  selector: (state: OutlineState) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
): [
  selector: (snapshot: StoreSnapshot<OutlineState>) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
]
export function selectOutlineState<T>(
  selector: (state: OutlineState) => T,
  compare?: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
) {
  return [
    (snapshot: StoreSnapshot<OutlineState>) => selector(snapshot.context),
    compare ?? shallowEqual,
  ] as const
}

export function useOutlineStore() {
  return useContext(OutlineStoreContext)
}

export function useOutlineState<T>(
  arg1: readonly [
    (snapshot: StoreSnapshot<OutlineState>) => T,
    (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
  ],
): T
export function useOutlineState<T>(
  selector: (snapshot: StoreSnapshot<OutlineState>) => T,
  compare?: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
): T
export function useOutlineState(...args: unknown[]) {
  const store = useOutlineStore()
  let selector, compare
  if (args.length === 2) {
    ;[selector, compare] = args
  } else if (args.length === 1 && Array.isArray(args[0]) && hasAtLeast(args[0], 2)) {
    ;[selector, compare] = args[0] as any
  } else if (args.length === 1 && Array.isArray(args[0]) && hasAtLeast(args[0], 1)) {
    ;[selector, compare] = [args[0] as any, shallowEqual]
  } else if (args.length === 1 && typeof args[0] === 'function') {
    ;[selector, compare] = [args[0] as any, shallowEqual]
  } else {
    throw new Error('Invalid arguments for useEditorPanelState')
  }
  return useSelector(store, selector as any, compare as any)
}

// /**
//  * Hook to subscribe to editor panel events
//  * @param args - The event name and handler function
//  * @example
//  * useOnEditorPanelEvent('inputKeyDown', () => {
//  *   console.log('Input key down event')
//  * })
//  */
// export function useOnEditorPanelEvent(...args: Parameters<EditorPanelStore['on']>) {
//   const store = useEditorPanelStore()
//   const event = args[0]
//   const handler = useCallbackRef(args[1])

//   useEffect(() => {
//     const subscription = store.on(event, handler)
//     return () => {
//       subscription.unsubscribe()
//     }
//   }, [event, store])
// }

/**
 * Hook to access the editor panel store trigger or create a wrapped trigger function
 *
 * @overload
 * @returns The store trigger object
 *
 * @overload
 * @template T - The parameter types for the wrapped trigger function
 * @param trigger - A function that receives the store trigger as the first parameter
 * @returns A wrapped function that calls the trigger with the store trigger prepended
 *
 * @example
 * // Get the trigger object directly
 * const trigger = useEditorPanelTrigger()
 * trigger.inputChange({ value: 'search' })
 *
 * @example
 * // Create a wrapped trigger function
 * const handleInputChange = useEditorPanelTrigger((trigger, value: string) => {
 *   trigger.inputChange({ value })
 * })
 * handleInputChange('search')
 */
export function useOutlineStoreTrigger(): OutlineStore['trigger']
export function useOutlineStoreTrigger<T extends any[]>(
  trigger: (...params: [trigger: OutlineStore['trigger'], ...T]) => void,
): (...args: T) => void
export function useOutlineStoreTrigger(...args: unknown[]) {
  const store = useOutlineStore()
  if (args.length === 0) {
    return store.trigger
  }
  const trigger = args[0] as (...params: [trigger: OutlineStore['trigger'], ...any[]]) => void
  return useCallbackRef((...args: any[]) => {
    trigger(...[store.trigger, ...args])
  })
}
