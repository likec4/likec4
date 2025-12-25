import type { NonEmptyArray } from '@likec4/core'
import JSON5 from 'json5'
import { map, pick } from 'remeda'
import { type VirtualModule, k } from './_shared'

const code = (projects: NonEmptyArray<{ id: string; title?: string }>) => `
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
  async load({ logger, projects }) {
    logger.info(k.dim('generating likec4:projects'))
    return code(map(projects, pick(['id', 'title'])))
  },
} satisfies VirtualModule
