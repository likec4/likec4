import type { PropsWithChildren } from 'react'
import { LikeC4ModelProvider } from '@likec4/diagram'
import { useStore } from '@nanostores/react'
import { useLikeC4ProjectContext } from './safeCtx'

/**
 * Fulfills the `LikeC4ModelProvider` contract of the diagram with the model of the current project.
 * Place it right around the diagram, not around the page: everything else reads the atoms of the project.
 */
export function LikeC4ModelContext({ children }: PropsWithChildren) {
  const model = useStore(useLikeC4ProjectContext().$model)
  return (
    <LikeC4ModelProvider likec4model={model}>
      {children}
    </LikeC4ModelProvider>
  )
}
