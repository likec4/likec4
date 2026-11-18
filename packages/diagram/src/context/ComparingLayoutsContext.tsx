import { createContext, useContext } from 'react'

const ComparingLayoutsContext = createContext<boolean>(false)

/**
 * Provides whether the diagram is comparing manual layout with the latest auto layout
 * (diagram actor is in `ready.comparing` state).
 *
 * Provided once by the diagram actor provider, so that nodes and edges
 * don't need to subscribe to the actor.
 */
export const ComparingLayoutsProvider = ComparingLayoutsContext.Provider

/**
 * Returns true if the diagram is comparing manual layout with the latest auto layout.
 *
 * Unlike `useEnabledFeatures().enableCompareWithLatest` (feature is available),
 * this reflects whether comparing is active.
 */
export function useIsComparingLayouts(): boolean {
  return useContext(ComparingLayoutsContext)
}
