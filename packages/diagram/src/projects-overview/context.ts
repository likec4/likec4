import { nonNullable } from '@likec4/core'
import { createContext, useContext } from 'react'
import type { ProjectsOverviewActorRef } from './actor'

const ProjectsOverviewActorContext = createContext<ProjectsOverviewActorRef | null>(null)

export const ProjectsOverviewActorContextProvider = ProjectsOverviewActorContext.Provider

export function useProjectsOverviewActor() {
  return nonNullable(useContext(ProjectsOverviewActorContext), 'No ProjectsOverviewActorContext')
}
