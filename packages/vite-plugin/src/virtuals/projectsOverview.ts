import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import JSON5 from 'json5'
import { type VirtualModule, k } from './_shared'

const code = (view: LayoutedProjectsView) => `
import { atom, useStore } from 'likec4/vite-plugin/internal'

export const $viewdata = atom(${JSON5.stringify(view)})

export function useLikeC4ProjectsOverview() {
  return useStore($viewdata)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$viewdata) {
      import.meta.hot.data.$viewdata = $viewdata
    }
    const update = md.$viewdata?.value
    if (update) {
      import.meta.hot.data.$viewdata.set(update)
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
  async load({ logger, projects, likec4 }) {
    if (projects.length < 2) {
      return noProjects()
    }
    logger.info(k.dim('generating likec4:projects-overview'))
    const view = await likec4.projectsOverview()
    return code(view)
  },
} satisfies VirtualModule
