import type { ProjectId } from '@likec4/core/types'
import type { LikeC4ProjectData } from '../LikeC4ProjectsProvider'
import { createContext, useContext } from 'react'

export type LikeC4ProjectsContext = {
  projects: ReadonlyArray<LikeC4ProjectData>
  onProjectChange: (id: ProjectId) => void
}

const LikeC4ProjectsContext = createContext<LikeC4ProjectsContext | null>(null)

export const LikeC4ProjectsContextProvider = LikeC4ProjectsContext.Provider

export function useOptionalProjectsContext(): LikeC4ProjectsContext | null {
  return useContext(LikeC4ProjectsContext)
}
