import type { LayoutedLikeC4ModelData } from '@likec4/core'
import { LikeC4ModelProvider } from '@likec4/diagram'
import { createLikeC4Model } from 'likec4/model'
import { nano } from 'likec4/react'
import { type PropsWithChildren, createContext, use, useMemo } from 'react'

const LikeC4ModelDataContext = createContext<nano.Atom<LayoutedLikeC4ModelData>>(null as any)

export function useLikeC4ModelDataContext() {
  return use(LikeC4ModelDataContext)
}

export function LikeC4ModelContext(
  { likec4data, children }: PropsWithChildren<{ likec4data: nano.Atom<LayoutedLikeC4ModelData> }>,
) {
  const $likec4model = useMemo(() => nano.computed(likec4data, (data) => createLikeC4Model(data)), [likec4data])

  const model = nano.useStore($likec4model)

  return (
    <LikeC4ModelDataContext value={likec4data}>
      <LikeC4ModelProvider likec4model={model}>
        {children}
      </LikeC4ModelProvider>
    </LikeC4ModelDataContext>
  )
}
