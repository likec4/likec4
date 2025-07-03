import { isEmpty, last } from 'remeda'
import type { aux, NonEmptyArray } from '../../types'
import { invariant, memoizeProp } from '../../utils'
import type { LikeC4Model } from '../LikeC4Model'
import { LikeC4ViewModel } from './LikeC4ViewModel'

export class LikeC4ViewsGroup<A extends aux.Any = aux.Any> {
  public readonly $model: LikeC4Model<A>

  /**
   * Path to this view group, e.g. "Group 1/Group 2/Group 3"
   */
  public readonly path: string

  /**
   * Title of this view group, e.g. "Group 3" if path is "Group 1/Group 2/Group 3"
   */
  public readonly title: string

  /**
   * Whether this is the root view group.
   * Root group is special group with an empty path and used only for internal purposes.
   * It is not visible to the user and should not be used in the code.
   */
  public readonly isRoot: boolean

  protected readonly parentPath: string | undefined

  protected readonly defaultViewId: aux.StrictViewId<A> | undefined

  constructor(
    $model: LikeC4Model<A>,
    path: NonEmptyArray<string>,
    defaultViewId: aux.StrictViewId<A> | undefined,
  ) {
    this.$model = $model
    this.path = path.join('/')
    this.isRoot = this.path === ''
    this.title = last(path)
    if (this.isRoot) {
      this.parentPath = undefined
    } else {
      this.parentPath = path.slice(0, -1).join('/')
    }
    this.defaultViewId = defaultViewId
  }

  /**
   * Default view of this view group.\
   * It is for the case when there is a view at the same path as this group.\
   * (if there are multiple views at the same path, the first one is chosen)
   *
   * @example
   * ```
   * // Assume the following views exist:
   * const views = [
   *   "Group 1/ Group 2 / View",
   *   "Group 1/ Group 2 / View / Subview",
   * ]
   * ```
   * Group with path `Group 1/ Group 2 / View`\
   * will have default view `Group 1/ Group 2 / View`
   */
  get defaultView(): LikeC4ViewModel<A> | null {
    if (!this.defaultViewId) {
      return null
    }
    return this.$model.view(this.defaultViewId)
  }

  /**
   * Returns path to this view group as an array of ancestors (excluding root) and this view group as the last element
   *
   * @throws Error if this is the root group.
   */
  get breadcrumbs(): [...LikeC4ViewsGroup<A>[], this] {
    invariant(!this.isRoot, 'Root view group has no breadcrumbs')
    return memoizeProp(this, 'breadcrumbs', () => {
      const parent = this.parent
      if (parent) {
        if (parent.isRoot) {
          return [parent, this]
        }
        return [...parent.breadcrumbs, this]
      }
      return [this]
    })
  }

  /**
   * Returns parent group
   */
  get parent(): LikeC4ViewsGroup<A> | null {
    // invariant(!this.isRoot, 'Root view group has no parent')
    if (this.parentPath === undefined) {
      return null
    }
    // if (isEmpty(this.parentPath)) {
    //   return null
    // }
    return this.$model.viewGroup(this.parentPath)
  }

  /**
   * Returns sorted set of children
   * - First groups
   * - Then views
   */
  get children(): ReadonlySet<LikeC4ViewsGroup<A> | LikeC4ViewModel<A>> {
    return this.$model.viewGroupChildren(this.path)
  }

  /**
   * Returns sorted array of children groups
   */
  get groups(): ReadonlyArray<LikeC4ViewsGroup<A>> {
    return memoizeProp(this, 'groups', () => {
      const groups: LikeC4ViewsGroup<A>[] = []
      for (const child of this.children) {
        if (child instanceof LikeC4ViewsGroup) {
          groups.push(child)
        }
      }
      return groups
    })
  }

  /**
   * Returns all views in this view group.
   */
  get views(): ReadonlyArray<LikeC4ViewModel<A>> {
    return memoizeProp(this, 'views', () => {
      const views: LikeC4ViewModel<A>[] = []
      for (const child of this.children) {
        if (child instanceof LikeC4ViewModel) {
          views.push(child)
        }
      }
      return views
    })
  }
}
