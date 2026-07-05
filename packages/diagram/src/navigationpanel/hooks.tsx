import type { ViewId } from '@likec4/core'
import { useMemo } from 'react'
import { createSafeContextForActor } from '../hooks/safeContext'
import type { NavigationPanelActorEvent, NavigationPanelActorRef } from './actor'

export const {
  ContextProvider: NavigationPanelActorContextProvider,
  selectContext: selectNavigationContext,
  selectSnapshot: selectNavigationSnapshot,
  useActorRef: useNavigationActorRef,
  useActorSelector: useNavigationActorSelector,
} = createSafeContextForActor<NavigationPanelActorRef>('NavigationPanel')

export interface NavigationActor {
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
