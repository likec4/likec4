import type { ProjectsOverviewActorRef } from './actor'
import { nonNullable } from '@likec4/core'
import { createContext, useContext } from 'react'

const ProjectsOverviewActorContext = createContext<ProjectsOverviewActorRef | null>(null)

export const ProjectsOverviewActorContextProvider = ProjectsOverviewActorContext.Provider

export function useProjectsOverviewActor() {
  return nonNullable(useContext(ProjectsOverviewActorContext), 'No ProjectsOverviewActorContext')
}
