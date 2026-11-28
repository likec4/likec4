import type { LikeC4Model } from '@likec4/core/model'
import type { ProjectId } from '@likec4/core/types'
import type { ProjectDiffs } from 'likec4:diffs'
import type { ElementIconRenderer } from 'likec4:icons'
import type { ReadableAtom } from 'nanostores'
import { IconRendererProvider } from '@likec4/diagram'
import { type PropsWithChildren, useMemo } from 'react'
import { LikeC4ProjectCtx } from './safeCtx'

/**
 * Provides the project the user is in: its model and diffs as atoms, and its icons.
 * Components subscribe only to what they show; the diagrams get the model from `LikeC4ModelContext`.
 * Icons are loaded by the route loader (`loadProjectIcons`), so they render without suspending.
 */
export function LikeC4ProjectContext({ projectId, $model, $diffs, IconRenderer, children }: PropsWithChildren<{
  projectId: ProjectId
  $model: ReadableAtom<LikeC4Model.Layouted>
  $diffs: ReadableAtom<ProjectDiffs>
  IconRenderer: ElementIconRenderer
}>) {
  const value = useMemo(() => ({ projectId, $model, $diffs }), [projectId, $model, $diffs])
  return (
    <LikeC4ProjectCtx value={value}>
      <IconRendererProvider value={IconRenderer}>
        {children}
      </IconRendererProvider>
    </LikeC4ProjectCtx>
  )
}
