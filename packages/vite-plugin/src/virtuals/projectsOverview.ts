import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import JSON5 from 'json5'
import { logGenerating } from '../logger'
import type { VirtualModule } from './_shared'
import { type ProjectsOverviewExports, buildProjectsOverviewExports } from './projectsOverviewExports'

const code = (view: LayoutedProjectsView, exports: ProjectsOverviewExports) => `
import { atom, useStore } from 'likec4/vite-plugin/internal'

export let $viewdata = atom(${JSON5.stringify(view)})
export let $exports = atom(${JSON5.stringify(exports)})

export function useLikeC4ProjectsOverview() {
  return useStore($viewdata)
}

export function useLikeC4ProjectsOverviewExports() {
  return useStore($exports)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    import.meta.hot.data.$update ??= (newdata) => {
      $viewdata.set(newdata)
    }
    import.meta.hot.data.$updateExports ??= (newdata) => {
      $exports.set(newdata)
    }
    const update = md.$viewdata?.get()
    if (update) {
      import.meta.hot.data.$update(update)
      import.meta.hot.data.$updateExports(md.$exports.get())
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

export function useLikeC4ProjectsOverviewExports() {
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
    const [view, dot] = await Promise.all([likec4.projectsOverview(), likec4.projectsOverviewDot()])
    const exports = buildProjectsOverviewExports({ view, dot, projects: projects.map(({ config }) => config) })
    return {
      code: code(view, exports),
      moduleType: 'js',
    }
  },
} satisfies VirtualModule
