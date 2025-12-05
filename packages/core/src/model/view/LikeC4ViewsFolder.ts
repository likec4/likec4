import { isEmptyish, last } from 'remeda'
import type { aux, NonEmptyArray } from '../../types'
import { invariant, memoizeProp } from '../../utils'
import type { LikeC4Model } from '../LikeC4Model'
import { LikeC4ViewModel } from './LikeC4ViewModel'

export class LikeC4ViewsFolder<A extends aux.Any = aux.Any> {
  public readonly $model: LikeC4Model<A>

  /**
   * Path to this view folder, processed by {@link normalizeViewPath}
   *
   * @example
   * "Folder 1/Folder 2/Folder 3"
   */
  public readonly path: string

  /**
   * Title of this view folder.
   *
   * @example
   * // title is the last segment of the path
   * path = "Folder 1/Folder 2/Folder 3"
   * title = "Folder 3"
   */
  public readonly title: string

  /**
   * Whether this is the root view folder.
   *
   * !NOTE
   * Root folder is special folder with an empty path and used only for internal purposes. \
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
   * Default view of this view folder.\
   * It is for the case when there is a view at the same path as this folder.\
   * (if there are multiple views at the same path, the first one is chosen)
   *
   * @example
   * ```
   * // Assume the following views exist:
   * const views = [
   *   "Folder 1/ Folder 2 / View",
   *   "Folder 1/ Folder 2 / View / Subview",
   * ]
   * ```
   * Group with path `Folder 1/ Folder 2 / View`\
   * will have default view `Folder 1/ Folder 2 / View`
   */
  get defaultView(): LikeC4ViewModel<A> | null {
    if (!this.defaultViewId) {
      return null
    }
    return this.$model.view(this.defaultViewId)
  }

  /**
   * Returns path to this view folder as an array of ancestors (excluding root) and this view folder as the last element
   *
   * @throws Error if this is the root folder.
   */
  get breadcrumbs(): [...LikeC4ViewsFolder<A>[], this] {
    invariant(!this.isRoot, 'Root view folder has no breadcrumbs')
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
   * Returns parent folder
   *
   * @throws Error if this is the root folder.
   */
  get parent(): LikeC4ViewsFolder<A> | null {
    invariant(!this.isRoot, 'Root view folder has no parent')
    if (isEmptyish(this.parentPath)) {
      return null
    }
    return this.$model.viewFolder(this.parentPath)
  }

  /**
   * Returns sorted set of children
   * - First folders
   * - Then views
   */
  get children(): ReadonlySet<LikeC4ViewsFolder<A> | LikeC4ViewModel<A>> {
    return this.$model.viewFolderItems(this.path)
  }

  /**
   * Returns sorted array of children folders
   */
  get folders(): ReadonlyArray<LikeC4ViewsFolder<A>> {
    return memoizeProp(this, 'folders', () => {
      const folders: LikeC4ViewsFolder<A>[] = []
      for (const child of this.children) {
        if (child instanceof LikeC4ViewsFolder) {
          folders.push(child)
        }
      }
      return folders
    })
  }

  /**
   * Returns all views in this view folder.
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
