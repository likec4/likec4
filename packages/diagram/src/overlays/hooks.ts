import { createSafeContextForActor } from '../hooks/safeContext'
import type { OverlaysActorRef } from './overlaysActor'

export const {
  ContextProvider: OverlaysActorContext,
  selectSnapshot: selectOverlaysSnapshot,
  useActorSelector: useSelectOverlaysActor,
} = createSafeContextForActor<OverlaysActorRef>('Overlays')
