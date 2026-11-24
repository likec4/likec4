import type { ProjectsOverviewOptions } from '@likec4/core/compute-view'

export interface ProjectsOverviewCandidate {
  readonly id: string
  readonly folder: string
  readonly overview: ProjectsOverviewOptions
}

export interface SelectedProjectsOverview {
  readonly options: ProjectsOverviewOptions | undefined
  readonly warning: string | undefined
}

/**
 * Picks the projects overview config for a workspace.
 * Equal configs are one config. Different configs warn, and the project with the shortest folder path wins.
 */
export function selectProjectsOverview(
  candidates: readonly ProjectsOverviewCandidate[],
): SelectedProjectsOverview {
  if (candidates.length === 0) {
    return { options: undefined, warning: undefined }
  }
  const ranked = [...candidates].sort((a, b) =>
    folderDepth(a.folder) - folderDepth(b.folder) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  )
  const winner = ranked[0]!
  const conflicts = ranked.filter(candidate => canonical(candidate.overview) !== canonical(winner.overview))
  if (conflicts.length === 0) {
    return { options: winner.overview, warning: undefined }
  }
  const others = conflicts.map(candidate => candidate.id).join(', ')
  return {
    options: winner.overview,
    warning: `Projects overview is set on more than one project. Using ${winner.id}. Also set on ${others}.`,
  }
}

function folderDepth(folder: string): number {
  return folder.split('/').filter(part => part.length > 0).length
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
