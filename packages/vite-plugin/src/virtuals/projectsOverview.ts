import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import JSON5 from 'json5'
import { logGenerating } from '../logger'
import type { VirtualModule } from './_shared'

const code = (view: LayoutedProjectsView) => `
import { atom, useStore } from 'likec4/vite-plugin/internal'

export let $viewdata = atom(${JSON5.stringify(view)})

export function useLikeC4ProjectsOverview() {
  return useStore($viewdata)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    import.meta.hot.data.$update ??= (newdata) => {
      $viewdata.set(newdata)
    }
    const update = md.$viewdata?.get()
    if (update) {
      import.meta.hot.data.$update(update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`

const noProjects = () => `
export function useLikeC4ProjectsOverview() {
  throw new Error('No projects overview available for this workspace: single project mode is enabled')
}
`

export const projectsOverviewModule = {
  id: 'likec4:projects-overview',
  virtualId: 'likec4:plugin/projects-overview.js',
  async load({ projects, likec4 }) {
    if (projects.length < 2) {
      return noProjects()
    }
    logGenerating('projects-overview')
    const view = await likec4.projectsOverview()
    return {
      code: code(view),
      moduleType: 'js',
    }
  },
} satisfies VirtualModule
