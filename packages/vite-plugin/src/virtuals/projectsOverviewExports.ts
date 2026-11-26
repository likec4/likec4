import type { LikeC4ProjectConfig, WebappExportFormat } from '@likec4/config'
import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import { generateProjectsOverviewSources } from '@likec4/generators'
import { effectiveWebappExportFormats } from './export-formats'

/**
 * Export formats and text sources of the projects overview.
 * A source is present only when its format is enabled.
 */
export interface ProjectsOverviewExports {
  readonly formats: readonly WebappExportFormat[]
  readonly dot?: string
  readonly d2?: string
  readonly mmd?: string
  readonly puml?: string
  readonly drawioEditUrl?: string
}

const GENERATED_TEXT_FORMATS: readonly WebappExportFormat[] = ['d2', 'mmd', 'puml', 'drawio']

type ProjectExportConfig = Pick<LikeC4ProjectConfig, 'webapp'>

/**
 * Returns formats enabled by every project, in canonical menu order.
 * The overview shows data of all projects, so one project can disable a format for it.
 */
export function overviewExportFormats(projects: ReadonlyArray<ProjectExportConfig>): WebappExportFormat[] {
  const [first, ...rest] = projects.map(effectiveWebappExportFormats)
  if (!first) {
    return []
  }
  return first.filter(format => rest.every(formats => formats.includes(format)))
}

/**
 * Builds the export sources of the overview for the formats enabled by all projects.
 */
export function buildProjectsOverviewExports(params: {
  view: LayoutedProjectsView
  dot: string
  projects: ReadonlyArray<ProjectExportConfig>
}): ProjectsOverviewExports {
  const formats = overviewExportFormats(params.projects)
  const enabled = new Set(formats)
  const needsText = GENERATED_TEXT_FORMATS.some(format => enabled.has(format))
  const text = needsText ? generateProjectsOverviewSources(params.view) : null
  return {
    formats,
    ...(enabled.has('dot') && { dot: params.dot }),
    ...(text && enabled.has('d2') && { d2: text.d2 }),
    ...(text && enabled.has('mmd') && { mmd: text.mmd }),
    ...(text && enabled.has('puml') && { puml: text.puml }),
    ...(text && enabled.has('drawio') && { drawioEditUrl: text.drawioEditUrl }),
  }
}
