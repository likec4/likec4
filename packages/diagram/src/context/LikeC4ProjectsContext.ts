import type { ProjectId } from '@likec4/core/types'
import { createContext, useContext } from 'react'
import type { LikeC4ProjectData } from '../LikeC4ProjectsProvider'

export type LikeC4ProjectsContext = {
  projects: ReadonlyArray<LikeC4ProjectData>
  onProjectChange: (id: ProjectId) => void
}

const LikeC4ProjectsContext = createContext<LikeC4ProjectsContext | null>(null)

export const LikeC4ProjectsContextProvider = LikeC4ProjectsContext.Provider

export function useOptionalProjectsContext(): LikeC4ProjectsContext | null {
  return useContext(LikeC4ProjectsContext)
}
