import { LikeC4ModelProvider } from '@likec4/diagram'
import { useStore } from '@nanostores/react'
import type { LayoutedLikeC4ModelData, LikeC4Model } from 'likec4/model'
import type { Atom, ReadableAtom } from 'nanostores'
import { type PropsWithChildren, createContext, useContext } from 'react'

const LikeC4ModelDataContext = createContext<Atom<LayoutedLikeC4ModelData>>(null as any)

export function useLikeC4ModelDataAtom() {
  return useContext(LikeC4ModelDataContext)
}

export function LikeC4ModelContext(
  { likec4data, likec4model, children }: PropsWithChildren<{
    likec4data: ReadableAtom<LayoutedLikeC4ModelData>
    likec4model: ReadableAtom<LikeC4Model.Layouted>
  }>,
) {
  // useLogger('LikeC4ModelContext', [likec4data, likec4model])
  const model = useStore(likec4model)

  return (
    <LikeC4ModelDataContext.Provider value={likec4data}>
      <LikeC4ModelProvider likec4model={model}>
        {children}
      </LikeC4ModelProvider>
    </LikeC4ModelDataContext.Provider>
  )
}
