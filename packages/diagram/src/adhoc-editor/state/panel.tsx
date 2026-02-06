import type { Fqn } from '@likec4/core'
import { type StoreSnapshot, createStore, shallowEqual } from '@xstate/store'
import { useSelector } from '@xstate/store/react'
import type { TreeCollection } from '@zag-js/collection'
import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { hasAtLeast } from 'remeda'
import { useCallbackRef, useLikeC4Model, useUpdateEffect } from '../../hooks'
import { useAdhocEditorActor } from '../hooks'
import { type TreeNodeData, createTreeCollection } from '../useElementsTree'
import { deriveElementStates } from './utils'

type EditorPanelState = {
  searchInput: string
  expandedValue: string[]
  collection: TreeCollection<TreeNodeData>
}
type EditorNodeState = TreeNodeData['state']

const createEditorPanelStore = ({
  initial,
  sideEffects,
}: {
  initial: TreeCollection<TreeNodeData>
  sideEffects: {
    onElementStateClick: (payload: { id: Fqn }) => void
  }
}) =>
  createStore({
    context: {
      searchInput: '',
      expandedValue: [] as string[],
      collection: initial,
    } as EditorPanelState,
    emits: {
      inputKeyDown: (payload: {}) => {
      },
    },
    on: {
      'inputChange': (context, event: { value: string }) => {
        return {
          ...context,
          searchInput: event.value,
        }
      },
      'inputKeyDown': (context, event: {}, enqueue) => {
        enqueue.emit.inputKeyDown()
      },
      'modelUpdate': (context, event: { collection: TreeCollection<TreeNodeData> }) => {
        return {
          ...context,
          collection: event.collection,
        }
      },
      'elementClick': (context, event: { id: Fqn }, enqueue) => {
        const current = context.collection.findNode(event.id)
        const path = context.collection.getIndexPath(event.id)
        if (!current || !path) {
          return context
        }
        // const nextState = current.state !== 'include' ? 'include' : 'unknown'
        enqueue.effect(() => {
          sideEffects.onElementStateClick({ id: event.id })
        })

        return context

        // // console.log('Changing state of', event.id, 'from', toChange.state, 'to', newState)
        // // //
        // // let newState
        // // switch (toChange.state) {
        // //   case 'unknown':
        // //     newState = 'included' as const
        // //     break
        // //   case 'included':
        // //     newState = 'excluded' as const
        // //     break
        // //   case 'excluded':
        // //     newState = 'unknown' as const
        // //     break
        // // }
        // return {
        //   ...context,
        //   collection: context.collection.replace(path, {
        //     ...current,
        //     state: nextState,
        //   }),
        // }
      },
    },
  })

export type EditorPanelStore = ReturnType<typeof createEditorPanelStore>

const EditorPanelStoreContext = createContext(null as unknown as EditorPanelStore)

export const EditorPanelStoreProvider = (props: PropsWithChildren) => {
  const likec4model = useLikeC4Model()

  const likec4modelRef = useRef(likec4model)
  likec4modelRef.current = likec4model

  const actorRef = useAdhocEditorActor()
  const store = useMemo(() =>
    createEditorPanelStore({
      initial: createTreeCollection(likec4model),
      sideEffects: {
        onElementStateClick({ id }) {
          actorRef.send({ type: 'toggle.element', id })
        },
      },
    }), [actorRef])

  useUpdateEffect(() => {
    store.trigger.modelUpdate({
      collection: createTreeCollection(
        likec4model,
        deriveElementStates(actorRef.getSnapshot().context),
      ),
    })
  }, [likec4model])

  useEffect(() => {
    const subscription = actorRef.on('view.update', () => {
      store.trigger.modelUpdate({
        collection: createTreeCollection(
          likec4modelRef.current,
          deriveElementStates(actorRef.getSnapshot().context),
        ),
      })
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [actorRef])

  return (
    <EditorPanelStoreContext.Provider value={store}>
      {props.children}
    </EditorPanelStoreContext.Provider>
  )
}

export function selectEditorPanelState<T>(
  selector: (state: EditorPanelState) => T,
): [
  selector: (snapshot: StoreSnapshot<EditorPanelState>) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
]
export function selectEditorPanelState<T>(
  selector: (state: EditorPanelState) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
): [
  selector: (snapshot: StoreSnapshot<EditorPanelState>) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
]
export function selectEditorPanelState<T>(
  selector: (state: EditorPanelState) => T,
  compare?: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
) {
  return [
    (snapshot: StoreSnapshot<EditorPanelState>) => selector(snapshot.context),
    compare ?? shallowEqual,
  ] as const
}

export function useEditorPanelStore() {
  return useContext(EditorPanelStoreContext)
}

export function useEditorPanelState<T>(
  arg1: readonly [
    (snapshot: StoreSnapshot<EditorPanelState>) => T,
    (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
  ],
): T
export function useEditorPanelState<T>(
  selector: (snapshot: StoreSnapshot<EditorPanelState>) => T,
  compare?: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
): T
export function useEditorPanelState(...args: unknown[]) {
  const store = useEditorPanelStore()
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

/**
 * Hook to subscribe to editor panel events
 * @param args - The event name and handler function
 * @example
 * useOnEditorPanelEvent('inputKeyDown', () => {
 *   console.log('Input key down event')
 * })
 */
export function useOnEditorPanelEvent(...args: Parameters<EditorPanelStore['on']>) {
  const store = useEditorPanelStore()
  const event = args[0]
  const handler = useCallbackRef(args[1])

  useEffect(() => {
    const subscription = store.on(event, handler)
    return () => {
      subscription.unsubscribe()
    }
  }, [event, store])
}

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
export function useEditorPanelTrigger(): EditorPanelStore['trigger']
export function useEditorPanelTrigger<T extends any[]>(
  trigger: (...params: [trigger: EditorPanelStore['trigger'], ...T]) => void,
): (...args: T) => void
export function useEditorPanelTrigger(...args: unknown[]) {
  const store = useEditorPanelStore()
  if (args.length === 0) {
    return store.trigger
  }
  const trigger = args[0] as (...params: [trigger: EditorPanelStore['trigger'], ...any[]]) => void
  return useCallbackRef((...args: any[]) => {
    trigger(...[store.trigger, ...args])
  })
}
