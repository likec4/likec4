import type { LikeC4Model } from '@likec4/core/model'
import type { Fqn, ProjectId, ViewId } from '@likec4/core/types'
import { createFuzzySearch, matchesMetadataSearch, METADATA_SEARCH_PREFIX, viewTitleWithFolder } from '@likec4/diagram'

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
  readonly title: string
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
      views: [...element.views()].map(view => ({ id: view.id, title: viewTitleWithFolder(view), _type: view._type })),
    })
  }
  const views: SearchView[] = []
  for (const view of model.views()) {
    views.push({
      type: 'view',
      projectId,
      id: view.id,
      title: viewTitleWithFolder(view),
      description: view.description.text ?? '',
      tags: view.tags,
      viewType: view._type,
    })
  }
  return { elements, views }
}

export interface WorkspaceIndex {
  readonly projects: ReadonlyArray<SearchProject>
  readonly elements: ReadonlyArray<SearchElement>
  readonly views: ReadonlyArray<SearchView>
  readonly fuzzyElements: (search: string) => SearchElement[]
  readonly fuzzyViews: (search: string) => SearchView[]
}

export function createWorkspaceIndex(
  projects: ReadonlyArray<SearchProject>,
  elements: ReadonlyArray<SearchElement>,
  views: ReadonlyArray<SearchView>,
): WorkspaceIndex {
  return {
    projects,
    elements,
    views,
    fuzzyElements: createFuzzySearch(elements, [
      { name: 'name', getFn: e => e.name },
      { name: 'title', getFn: e => e.title },
      { name: 'id', getFn: e => e.id },
      { name: 'summary', getFn: e => e.summary },
    ]),
    fuzzyViews: createFuzzySearch(views, [
      { name: 'id', getFn: v => v.id },
      { name: 'title', getFn: v => v.title },
      { name: 'description', getFn: v => v.description },
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
function findElements(index: WorkspaceIndex, text: string, scoped: boolean): SearchElement[] {
  switch (true) {
    case text === '' && scoped:
      return [...index.elements]
    case text === '':
      return index.elements.filter(e => !e.id.includes('.'))
    case text.startsWith('kind:'): {
      const kind = text.slice(5)
      return index.elements.filter(e => e.kind.toLowerCase().includes(kind))
    }
    case text.startsWith('#'): {
      const tag = text.slice(1)
      return index.elements.filter(e => e.tags.some(t => t.toLowerCase().includes(tag)))
    }
    case text.startsWith(METADATA_SEARCH_PREFIX):
      return index.elements.filter(e => matchesMetadataSearch(e.metadata, text))
    default:
      return index.fuzzyElements(text)
  }
}

function findViews(index: WorkspaceIndex, text: string): SearchView[] {
  switch (true) {
    case text === '':
      return [...index.views]
    case text.startsWith('kind:'):
    case text.startsWith(METADATA_SEARCH_PREFIX):
      return []
    case text.startsWith('#'): {
      const tag = text.slice(1)
      return index.views.filter(v => v.tags.some(t => t.toLowerCase().includes(tag)))
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
  const byProject = new Map<ProjectId, T[]>()
  for (const item of items) {
    const list = byProject.get(item.projectId)
    if (list) {
      list.push(item)
    } else {
      byProject.set(item.projectId, [item])
    }
  }
  return [...byProject.entries()]
    .map(([projectId, list]) => ({
      projectId,
      // stable sort keeps the model order inside the same rank
      items: [...list].sort((a, b) => rank(a.title, text) - rank(b.title, text)),
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
  for (const item of [...elements, ...views]) {
    counts.set(item.projectId, (counts.get(item.projectId) ?? 0) + 1)
  }

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
