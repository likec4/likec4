import type { LikeC4ProjectConfig } from '@likec4/config'
import type { NonEmptyArray } from '@likec4/core'
import JSON5 from 'json5'
import { map } from 'remeda'
import { logGenerating } from '../logger'
import type { VirtualModule } from './_shared'

type ProjectData = {
  id: string
  title: string | undefined
  landingPage: LikeC4ProjectConfig['landingPage']
}

const code = (projects: NonEmptyArray<ProjectData>) => `
import { atom, useStore } from 'likec4/vite-plugin/internal'

export const isSingleProject = ${projects.length === 1};
export const projects = ${JSON5.stringify(projects, null, 2)};

export const $projects = atom([...projects])

export function useLikeC4Projects() {
  return useStore($projects)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$projects) {
      import.meta.hot.data.$projects = $projects
    }
    if (!import.meta.hot.data.projects) {
      import.meta.hot.data.projects = projects
    }      
    const update = md.projects
    if (update) {
      import.meta.hot.data.projects.length = 0
      import.meta.hot.data.projects.push(...update)
      import.meta.hot.data.$projects.set(update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`

export const projectsModule = {
  id: 'likec4:projects',
  virtualId: 'likec4:plugin/projects.js',
  async load({ projects }) {
    logGenerating('projects')
    return {
      code: code(map(projects, p => ({
        id: p.id,
        title: p.title,
        landingPage: p.config.landingPage,
      }))),
      moduleType: 'js',
      moduleSideEffects: false,
    }
  },
} satisfies VirtualModule
