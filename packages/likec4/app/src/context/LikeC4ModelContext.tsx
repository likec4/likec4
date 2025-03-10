import type { LayoutedLikeC4ModelData } from '@likec4/core'
import { LikeC4ModelProvider } from '@likec4/diagram'
import { useStore } from '@nanostores/react'
import { createLikeC4Model } from 'likec4/model'
import { type Atom, computed } from 'nanostores'
import { type PropsWithChildren, createContext, use, useMemo } from 'react'
// import { useLikeC4Model } from 'virtual:likc4/model'

const LikeC4ModelDataContext = createContext<Atom<LayoutedLikeC4ModelData>>(null as any)

export function useLikeC4ModelDataContext() {
  return use(LikeC4ModelDataContext)
}

export function LikeC4ModelContext(
  { likec4data, children }: PropsWithChildren<{ likec4data: Atom<LayoutedLikeC4ModelData> }>,
) {
  const $likec4model = useMemo(() => computed(likec4data, (data) => createLikeC4Model(data)), [likec4data])

  const model = useStore($likec4model)

  return (
    <LikeC4ModelDataContext value={likec4data}>
      <LikeC4ModelProvider likec4model={model}>
        {children}
      </LikeC4ModelProvider>
    </LikeC4ModelDataContext>
  )
}
