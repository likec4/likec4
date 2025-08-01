import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, createContext, useContext, useMemo } from 'react'
import type { NavigationPanelActorContext, NavigationPanelActorRef, NavigationPanelActorSnapshot } from './actor'

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

export function useNavigationActor() {
  const actorRef = useNavigationActorRef()

  return useMemo(() => ({
    send: actorRef.send,
    clearSearch: () => actorRef.send({ type: 'searchQuery.change', value: '' }),
    closeDropdown: () => actorRef.send({ type: 'dropdown.dismiss' }),
  }), [actorRef])
}
