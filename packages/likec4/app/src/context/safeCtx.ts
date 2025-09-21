import type { LayoutedLikeC4ModelData } from 'likec4/model'
import type { Atom } from 'nanostores'
import { createContext, useContext } from 'react'

/**
 * To improve experience with HMR, we move context to separate files and use as a boundary for hoooks
 */
const LikeC4ModelDataContext = createContext<Atom<LayoutedLikeC4ModelData>>(null as any)

export const LikeC4ModelDataContextProvider = LikeC4ModelDataContext.Provider

export const useLikeC4ModelDataAtom = () => {
  const ctx = useContext(LikeC4ModelDataContext)
  if (ctx === null) {
    throw new Error('LikeC4ModelDataAtom is not provided')
  }
  return ctx
}
