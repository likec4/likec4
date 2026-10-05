import type { DiffSummary, LayoutedView } from '@likec4/core/types'
import JSON5 from 'json5'
import { logGenerating } from '../logger'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches } from './_shared'

/**
 * Diffs of the project, with the compare views of the views they change (by diff id, then by view id)
 */
interface ProjectDiffs {
  diffs: DiffSummary[]
  views: Record<string, Record<string, LayoutedView>>
}

const code = (data: ProjectDiffs) => `
import { atom } from 'likec4/vite-plugin/internal'

export let $diffs = atom(${JSON5.stringify(data)})

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$diffs) {
      import.meta.hot.data.$diffs = $diffs
    }
    const update = md.$diffs?.get()
    if (update) {
      import.meta.hot.data.$diffs.set(update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`

export const projectDiffsModule: ProjectVirtualModule = {
  ...generateMatches('diffs'),
  async load({ likec4, project }) {
    logGenerating('diffs', project.id)
    const diffs = await likec4.modelDiffs.list(project.id)
    const views: ProjectDiffs['views'] = {}
    for (const diff of diffs) {
      const byView: Record<string, LayoutedView> = {}
      for (const { id: viewId } of diff.views) {
        const view = await likec4.modelDiffs.layoutCompareView({ projectId: project.id, diffId: diff.id, viewId })
        if (view) {
          byView[viewId] = view
        }
      }
      views[diff.id] = byView
    }
    return {
      code: code({ diffs, views }),
      moduleType: 'js',
    }
  },
}

export const diffsModule = generateCombinedProjects('diffs', 'loadDiffs')
