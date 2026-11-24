import type { LayoutedProjectsView } from '@likec4/core'
import type { ProjectId } from '@likec4/core/types'

/**
 * Cross-project link: how many relationships go to (or come from) another project
 */
export interface ProjectLink {
  readonly projectId: ProjectId
  readonly title: string
  readonly relationships: number
}

export interface CatalogProject {
  readonly id: ProjectId
  readonly title: string
  /**
   * Folder of the project, relative to the workspace
   */
  readonly path: string | null
  readonly contactPerson: string | null
  /**
   * Missing when the view was layouted by an older version
   */
  readonly elements: number | null
  readonly relationships: number | null
  readonly views: number | null
  /**
   * Projects this one imports from, most relationships first
   */
  readonly dependsOn: ReadonlyArray<ProjectLink>
  /**
   * Projects that import from this one, most relationships first
   */
  readonly usedBy: ReadonlyArray<ProjectLink>
}

export interface ProjectsCatalog {
  readonly projects: ReadonlyArray<CatalogProject>
  readonly totals: {
    readonly projects: number
    readonly elements: number | null
    readonly views: number | null
  }
}

export type CatalogSort = 'name' | 'elements' | 'usedBy'

const byRelationships = (a: ProjectLink, b: ProjectLink): number =>
  b.relationships - a.relationships || a.title.localeCompare(b.title)

const sumOf = (values: ReadonlyArray<number | null>): number | null => {
  let total = 0
  for (const value of values) {
    if (value === null) {
      return null
    }
    total += value
  }
  return total
}

/**
 * Turns the layouted projects view into a flat list of projects with their cross-project links
 */
/**
 * Project details from the workspace config (`likec4:projects`)
 */
export interface ProjectInfo {
  readonly id: string
  readonly path?: string | undefined
  readonly contactPerson?: string | undefined
}

export function buildProjectsCatalog(
  view: LayoutedProjectsView,
  infos: ReadonlyArray<ProjectInfo> = [],
): ProjectsCatalog {
  const infoById = new Map(infos.map(info => [info.id, info] as const))
  const nodeToProject = new Map(view.nodes.map(node => [node.id, node] as const))

  const dependsOn = new Map<ProjectId, ProjectLink[]>()
  const usedBy = new Map<ProjectId, ProjectLink[]>()
  const push = (map: Map<ProjectId, ProjectLink[]>, key: ProjectId, link: ProjectLink) => {
    const list = map.get(key)
    if (list) {
      list.push(link)
    } else {
      map.set(key, [link])
    }
  }

  for (const edge of view.edges) {
    const source = nodeToProject.get(edge.source)
    const target = nodeToProject.get(edge.target)
    if (!source || !target || source.projectId === target.projectId) {
      continue
    }
    const relationships = edge.relations.length
    push(dependsOn, source.projectId, { projectId: target.projectId, title: target.title, relationships })
    push(usedBy, target.projectId, { projectId: source.projectId, title: source.title, relationships })
  }

  const projects = view.nodes.map((node): CatalogProject => ({
    id: node.projectId,
    title: node.title,
    path: infoById.get(node.projectId)?.path || null,
    contactPerson: infoById.get(node.projectId)?.contactPerson || null,
    elements: node.metrics?.elements ?? null,
    relationships: node.metrics?.relationships ?? null,
    views: node.metrics?.views ?? null,
    dependsOn: (dependsOn.get(node.projectId) ?? []).sort(byRelationships),
    usedBy: (usedBy.get(node.projectId) ?? []).sort(byRelationships),
  }))

  return {
    projects,
    totals: {
      projects: projects.length,
      elements: sumOf(projects.map(p => p.elements)),
      views: sumOf(projects.map(p => p.views)),
    },
  }
}

/**
 * Sorts projects for the cards and the table
 */
export function selectProjects(
  projects: ReadonlyArray<CatalogProject>,
  sort: CatalogSort,
): CatalogProject[] {
  return [...projects].sort((a, b) => {
    switch (true) {
      case sort === 'elements':
        return (b.elements ?? 0) - (a.elements ?? 0) || a.title.localeCompare(b.title)
      case sort === 'usedBy':
        return b.usedBy.length - a.usedBy.length
          || totalRelationships(b.usedBy) - totalRelationships(a.usedBy)
          || a.title.localeCompare(b.title)
      default:
        return a.title.localeCompare(b.title)
    }
  })
}

export function totalRelationships(links: ReadonlyArray<ProjectLink>): number {
  return links.reduce((acc, link) => acc + link.relationships, 0)
}

/**
 * Two letters for the project monogram: first letters of the first two words, or the first two letters
 */
export function projectInitials(title: string): string {
  const words = title.replace(/[&_\-./]+/g, ' ').split(/\s+/).filter(Boolean)
  const [first, second] = words
  if (first && second) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase()
  }
  return (first ?? title).slice(0, 2).toUpperCase()
}

const MONOGRAM_COLORS = ['primary', 'secondary', 'green', 'indigo', 'amber', 'red', 'muted'] as const
export type MonogramColor = typeof MONOGRAM_COLORS[number]

/**
 * Stable element color per project id, so a project keeps its color across views and reloads
 */
export function monogramColor(projectId: string): MonogramColor {
  let hash = 0
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) | 0
  }
  return MONOGRAM_COLORS[Math.abs(hash) % MONOGRAM_COLORS.length] ?? 'primary'
}
