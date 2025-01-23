import { LikeC4ModelProvider } from '@likec4/diagram'
import { useStore } from '@nanostores/react'
import type { PropsWithChildren } from 'react'
import { $likeC4Model, useIsModelLoaded } from './state'

export function LikeC4Context({ children }: PropsWithChildren) {
  const likec4model = useStore($likeC4Model)
  const isModelLoaded = useIsModelLoaded()
  return (
    <LikeC4ModelProvider likec4model={likec4model}>
      {isModelLoaded && <>{children}</>}
    </LikeC4ModelProvider>
  )
}
