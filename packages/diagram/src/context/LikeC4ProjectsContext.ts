import type { LikeC4Project, ProjectId } from '@likec4/core/types'
import { createContext, useContext } from 'react'

export type LikeC4ProjectsContext = {
  projects: ReadonlyArray<LikeC4Project>
  onProjectChange: (id: ProjectId) => void
}

const LikeC4ProjectsContext = createContext<LikeC4ProjectsContext | null>(null)

export const LikeC4ProjectsContextProvider = LikeC4ProjectsContext.Provider

export function useOptionalProjectsContext(): LikeC4ProjectsContext | null {
  return useContext(LikeC4ProjectsContext)
}
