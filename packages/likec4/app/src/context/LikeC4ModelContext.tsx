import type { LayoutedLikeC4ModelData } from '@likec4/core'
import { LikeC4ModelProvider } from '@likec4/diagram'
import { LikeC4Model } from 'likec4/model'
import { nano } from 'likec4/react'
import { type PropsWithChildren, createContext, useContext, useMemo } from 'react'

const LikeC4ModelDataContext = createContext<nano.Atom<LayoutedLikeC4ModelData>>(null as any)

export function useLikeC4ModelDataAtom() {
  return useContext(LikeC4ModelDataContext)
}

export function LikeC4ModelContext(
  { likec4data, children }: PropsWithChildren<{ likec4data: nano.ReadableAtom<LayoutedLikeC4ModelData> }>,
) {
  const $likec4model = useMemo(() => nano.batched(likec4data, (data) => LikeC4Model.create(data)), [likec4data])

  const model = nano.useStore($likec4model)

  return (
    <LikeC4ModelDataContext.Provider value={likec4data}>
      <LikeC4ModelProvider likec4model={model}>
        {children}
      </LikeC4ModelProvider>
    </LikeC4ModelDataContext.Provider>
  )
}
