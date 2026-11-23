import { parentFqn } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import { isLikeC4ViewsFolder } from '@likec4/core/model'
import type { Fqn, NonEmptyReadonlyArray, ProjectId, ViewId } from '@likec4/core/types'
import { someTagIncludes } from '@likec4/core/utils'
import { createFuzzySearch, matchesMetadataSearch, METADATA_SEARCH_PREFIX } from '@likec4/diagram'

export interface SearchProject {
  readonly id: ProjectId
  readonly title: string
}

export interface ViewRef {
  readonly id: ViewId
  readonly title: string
  readonly _type: LikeC4Model.View['_type']
}

export interface SearchElement {
  readonly type: 'element'
  readonly projectId: ProjectId
  readonly id: Fqn
  readonly name: string
  readonly title: string
  readonly kind: string
  readonly shape: string
  readonly summary: string
  readonly tags: ReadonlyArray<string>
  readonly metadata: LikeC4Model.Element['metadata']
  readonly views: ReadonlyArray<ViewRef>
}

export interface SearchView {
  readonly type: 'view'
  readonly projectId: ProjectId
  readonly id: ViewId
  /**
   * View title without folder path
   */
  readonly title: string
  /**
   * Folder path (will be empty for root views)
   */
  readonly folder: string[]
  readonly description: string
  readonly tags: ReadonlyArray<string>
  readonly viewType: LikeC4Model.View['_type']
}

export type SearchItem = SearchElement | SearchView

export interface ResultGroup<T> {
  readonly projectId: ProjectId
  readonly items: ReadonlyArray<T>
}

export interface SearchResult {
  /**
   * Text to match, without the `@project` prefix, lowercased
   */
  readonly text: string
  /**
   * Projects that `@prefix` points to, when the query starts with `@`
   */
  readonly scopeCandidates: ReadonlyArray<ProjectId> | null
  /**
   * Matches per project, before applying the scope
   */
  readonly counts: ReadonlyMap<ProjectId, number>
  readonly total: number
  readonly elements: ReadonlyArray<ResultGroup<SearchElement>>
  readonly views: ReadonlyArray<ResultGroup<SearchView>>
}

/**
 * Flattens one project's model into search entries (imported elements belong to their own project)
 */
export function indexModel(projectId: ProjectId, model: Readonly<LikeC4Model.Layouted>): {
  elements: SearchElement[]
  views: SearchView[]
} {
  const elements: SearchElement[] = []
  for (const element of model.elements()) {
    if (element.imported) {
      continue
    }
    elements.push({
      type: 'element',
      projectId,
      id: element.id,
      name: element.name,
      title: element.title,
      kind: element.kind,
      shape: element.shape,
      summary: element.summary.text ?? '',
      tags: element.tags,
      metadata: element.metadata,
      views: [...element.views()].map(view => ({ id: view.id, title: view.titleOrId, _type: view._type })),
    })
  }
  const views: SearchView[] = []
  for (const view of model.views()) {
    views.push({
      type: 'view',
      projectId,
      id: view.id,
      title: view.titleOrId,
      folder: [...view.breadcrumbs].filter(isLikeC4ViewsFolder).map((b) => b.title),
      description: view.description.text ?? '',
      tags: view.tags,
      viewType: view._type,
    })
  }
  return { elements, views }
}

export interface WorkspaceIndex {
  readonly projects: NonEmptyReadonlyArray<SearchProject>
  readonly elements: ReadonlyArray<SearchElement>
  readonly rootElements: ReadonlyArray<SearchElement>
  readonly views: ReadonlyArray<SearchView>
  fuzzyElements(search: string): SearchElement[]
  fuzzyViews(search: string): SearchView[]
  titleOf(projectId: ProjectId): string
}

export function createWorkspaceIndex(
  projects: NonEmptyReadonlyArray<SearchProject>,
  elements: ReadonlyArray<SearchElement>,
  views: ReadonlyArray<SearchView>,
): WorkspaceIndex {
  const projectsMap = new Map(projects.map(project => [project.id, project]))
  let rootElements: WorkspaceIndex['rootElements'] | undefined
  return {
    projects,
    elements,
    views,
    get rootElements() {
      return rootElements ??= elements.filter(e => !parentFqn(e.id))
    },
    titleOf(projectId) {
      return projectsMap.get(projectId)?.title ?? projectId
    },
    fuzzyElements: createFuzzySearch(elements, [
      { name: 'name', weight: 8, getFn: c => c.name },
      { name: 'title', weight: 4, getFn: c => c.title },
      { name: 'id', weight: 3, getFn: c => c.id },
      { name: 'summary', weight: 1, getFn: c => c.summary },
      { name: 'kind', getFn: c => c.kind },
      { name: 'tags', getFn: c => c.tags },
    ]),
    fuzzyViews: createFuzzySearch(views, [
      { name: 'id', weight: 8, getFn: v => v.id },
      { name: 'title', weight: 4, getFn: v => v.title },
      { name: 'description', weight: 1, getFn: v => v.description },
      { name: 'tags', getFn: c => c.tags },
    ]),
  }
}

/**
 * Splits `@check payment` into the project prefix and the text
 */
export function parseQuery(
  query: string,
  projects: ReadonlyArray<SearchProject>,
): { text: string; scopeCandidates: ProjectId[] | null } {
  const match = /^@(\S*)\s*(.*)$/s.exec(query.trimStart())
  if (!match) {
    return { text: query.trim().toLowerCase(), scopeCandidates: null }
  }
  const prefix = (match[1] ?? '').toLowerCase()
  const scopeCandidates = projects
    .filter(p => p.id.toLowerCase().startsWith(prefix) || p.title.toLowerCase().startsWith(prefix))
    .map(p => p.id)
  return { text: (match[2] ?? '').trim().toLowerCase(), scopeCandidates }
}

/**
 * Empty text browses: top-level elements across the workspace, every element within one project
 */
function findElements(index: WorkspaceIndex, text: string, scoped: boolean): readonly SearchElement[] {
  switch (true) {
    case text.trimEnd() === '':
      return scoped ? index.elements : index.rootElements
    case text.startsWith('kind:'): {
      const kind = text.slice(5)
      return index.elements.filter(e => e.kind.toLowerCase().includes(kind))
    }
    case text.startsWith('#'): {
      const tag = text.slice(1)
      return index.elements.filter(someTagIncludes(tag))
    }
    case text.startsWith(METADATA_SEARCH_PREFIX):
      return index.elements.filter(e => matchesMetadataSearch(e.metadata, text))
    default:
      return index.fuzzyElements(text)
  }
}

function findViews(index: WorkspaceIndex, text: string): readonly SearchView[] {
  switch (true) {
    case text.trimEnd() === '':
      return index.views
    case text.startsWith('kind:'):
    case text.startsWith(METADATA_SEARCH_PREFIX):
      return []
    case text.startsWith('#'): {
      const tag = text.slice(1)
      return index.views.filter(someTagIncludes(tag))
    }
    default:
      return index.fuzzyViews(text)
  }
}

/**
 * Title matches first: starts with the text, then contains it, then the rest (fuzzy or by id/description)
 */
function rank(title: string, text: string): number {
  const t = title.toLowerCase()
  const at = t.indexOf(text)
  return at === 0 ? 0 : at > 0 ? 1 : 2
}

function groupByProject<T extends SearchItem>(
  items: ReadonlyArray<T>,
  text: string,
  projectOrder: ReadonlyArray<ProjectId>,
  sortByCount: boolean,
): ResultGroup<T>[] {
  const byProject = Map.groupBy(items, item => item.projectId)

  return [...byProject.entries()]
    .map(([projectId, list]) => ({
      projectId,
      // stable sort keeps the model order inside the same rank
      items: list.toSorted((a, b) => rank(a.title, text) - rank(b.title, text)),
    }))
    .sort((a, b) => {
      const byOrder = projectOrder.indexOf(a.projectId) - projectOrder.indexOf(b.projectId)
      // browsing keeps the workspace order, so groups never move while models load
      return sortByCount ? b.items.length - a.items.length || byOrder : byOrder
    })
}

/**
 * Searches all projects; `scope` (or a single `@prefix` candidate) limits the result groups to one project,
 * while `counts` always cover every project, for the scope chips
 */
export function searchWorkspace(index: WorkspaceIndex, query: string, scope: ProjectId | null): SearchResult {
  const { text, scopeCandidates } = scope
    ? { text: query.trim().toLowerCase(), scopeCandidates: null }
    : parseQuery(query, index.projects)

  const elements = findElements(index, text, scope !== null || scopeCandidates?.length === 1)
  const views = findViews(index, text)

  const counts = new Map<ProjectId, number>()
  const countProject = ({ projectId }: { projectId: ProjectId }) => {
    counts.set(projectId, (counts.get(projectId) ?? 0) + 1)
  }
  elements.forEach(countProject)
  views.forEach(countProject)

  const inScope = (item: SearchItem) => {
    switch (true) {
      case scope !== null:
        return item.projectId === scope
      case scopeCandidates !== null:
        return scopeCandidates.includes(item.projectId)
      default:
        return true
    }
  }

  const order = index.projects.map(p => p.id)
  return {
    text,
    scopeCandidates,
    counts,
    total: elements.length + views.length,
    elements: groupByProject(elements.filter(inScope), text, order, text !== ''),
    views: groupByProject(views.filter(inScope), text, order, text !== ''),
  }
}
