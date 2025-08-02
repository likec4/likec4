import type { ViewId } from '@likec4/core'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, createContext, useContext, useMemo } from 'react'
import type {
  NavigationPanelActorContext,
  NavigationPanelActorEvent,
  NavigationPanelActorRef,
  NavigationPanelActorSnapshot,
} from './actor'

const NavigationPanelActorSafeContext = createContext<NavigationPanelActorRef>(null as any)
NavigationPanelActorSafeContext.displayName = 'NavigationPanelActorSafeContext'

export const NavigationPanelActorContextProvider = NavigationPanelActorSafeContext.Provider

export const useNavigationActorRef = () => {
  const ctx = useContext(NavigationPanelActorSafeContext)
  if (ctx === null) {
    throw new Error('NavigationPanelActorRef is not found in the context')
  }
  return ctx
}

export function useNavigationActorSnapshot<T = unknown>(
  selector: (context: NavigationPanelActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps?: DependencyList,
): T {
  const actorRef = useNavigationActorRef()
  return useXstateSelector(actorRef, selector, compare)
}

export function useNavigationActorContext<T = unknown>(
  selector: (context: NavigationPanelActorContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps?: DependencyList,
): T {
  return useNavigationActorSnapshot(snapshot => selector(snapshot.context), compare, deps)
}

export type NavigationActor = {
  readonly actorRef: NavigationPanelActorRef
  send: (event: NavigationPanelActorEvent) => void
  selectFolder: (folderPath: string) => void
  selectView: (viewId: ViewId) => void
  /**
   * If the navigation dropdown is opened
   */
  isOpened: () => boolean
  clearSearch: () => void
  closeDropdown: () => void
}

export function useNavigationActor(): NavigationActor {
  const actorRef = useNavigationActorRef()

  return useMemo(() => ({
    actorRef,
    send: (event: NavigationPanelActorEvent) => actorRef.send(event),
    selectFolder: (folderPath: string) => actorRef.send({ type: 'select.folder', folderPath }),
    selectView: (viewId: ViewId) => actorRef.send({ type: 'select.view', viewId }),
    isOpened: () => {
      const snapshot = actorRef.getSnapshot()
      return snapshot.hasTag('active')
    },
    clearSearch: () => actorRef.send({ type: 'searchQuery.change', value: '' }),
    closeDropdown: () => actorRef.send({ type: 'dropdown.dismiss' }),
  }), [actorRef])
}
