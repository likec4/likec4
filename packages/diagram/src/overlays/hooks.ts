import type { OverlaysActorRef } from './overlaysActor'
import { createSafeContextForActor } from '../hooks/safeContext'

export const {
  ContextProvider: OverlaysActorContext,
  selectSnapshot: selectOverlaysSnapshot,
  useActorSelector: useSelectOverlaysActor,
} = createSafeContextForActor<OverlaysActorRef>('Overlays')
