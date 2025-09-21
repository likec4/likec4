import type { LikeC4Project, ProjectId } from '@likec4/core/types'
import { createContext } from 'react'

export type LikeC4ProjectsContext = {
  projects: ReadonlyArray<LikeC4Project>
  onProjectChange: (id: ProjectId) => void
}

export const LikeC4ProjectsContext = createContext<LikeC4ProjectsContext | null>(null)
