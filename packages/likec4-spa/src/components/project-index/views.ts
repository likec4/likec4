import type { LikeC4Model } from '@likec4/core/model'
import { type LayoutedView, type RichTextOrEmpty, type ViewId, RichText } from '@likec4/core/types'

export type ViewType = LayoutedView['_type']

export interface IndexView {
  readonly id: ViewId
  readonly title: string
  /**
   * Folder path ("Context / Cloud"), null for views at the root
   */
  readonly folder: string | null
  readonly _type: ViewType
  readonly description: RichTextOrEmpty
  /**
   * Nodes on the diagram
   */
  readonly nodes: number
  readonly view: LayoutedView
}

export type ViewSort = 'name' | 'folder' | 'type'

/**
 * Views of the landing page with the details the cards and the table show
 */
export function indexViews(
  model: Readonly<LikeC4Model.Layouted>,
  views: ReadonlyArray<LayoutedView>,
): IndexView[] {
  return views.map((view): IndexView => {
    const vm = model.findView(view.id)
    const folder = vm && !vm.folder.isRoot ? vm.folder.breadcrumbs.map(f => f.title).join(' / ') : null
    return {
      id: view.id,
      title: vm?.titleOrUntitled ?? view.title ?? view.id,
      folder,
      _type: view._type,
      description: RichText.from(view.description, model.resolveMarkdownRef),
      nodes: view.nodes.length,
      view,
    }
  })
}

const TYPE_ORDER: Record<string, number> = { element: 0, dynamic: 1, deployment: 2 }

export function sortViews(views: ReadonlyArray<IndexView>, sort: ViewSort): IndexView[] {
  const byName = (a: IndexView, b: IndexView) => a.title.localeCompare(b.title)
  return [...views].sort((a, b) => {
    switch (true) {
      case sort === 'folder':
        return (a.folder ?? '').localeCompare(b.folder ?? '') || byName(a, b)
      case sort === 'type':
        return (TYPE_ORDER[a._type] ?? 9) - (TYPE_ORDER[b._type] ?? 9) || byName(a, b)
      default:
        return byName(a, b)
    }
  })
}

export function viewTypeLabel(type: ViewType): string {
  switch (type) {
    case 'dynamic':
      return 'Dynamic'
    case 'deployment':
      return 'Deployment'
    default:
      return 'Element'
  }
}
