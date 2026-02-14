import type { aux, NonEmptyArray } from '../../types';
import type { LikeC4Model } from '../LikeC4Model';
import { LikeC4ViewModel } from './LikeC4ViewModel';
export declare class LikeC4ViewsFolder<A extends aux.Any = aux.Any> {
    readonly $model: LikeC4Model<A>;
    /**
     * Path to this view folder, processed by {@link normalizeViewPath}
     *
     * @example
     * "Folder 1/Folder 2/Folder 3"
     */
    readonly path: string;
    /**
     * Title of this view folder.
     *
     * @example
     * // title is the last segment of the path
     * path = "Folder 1/Folder 2/Folder 3"
     * title = "Folder 3"
     */
    readonly title: string;
    /**
     * Whether this is the root view folder.
     *
     * !NOTE
     * Root folder is special folder with an empty path and used only for internal purposes. \
     * It is not visible to the user and should not be used in the code.
     */
    readonly isRoot: boolean;
    protected readonly parentPath: string | undefined;
    protected readonly defaultViewId: aux.StrictViewId<A> | undefined;
    constructor($model: LikeC4Model<A>, path: NonEmptyArray<string>, defaultViewId: aux.StrictViewId<A> | undefined);
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
    get defaultView(): LikeC4ViewModel<A> | null;
    /**
     * Returns path to this view folder as an array of ancestors (excluding root) and this view folder as the last element
     *
     * @throws Error if this is the root folder.
     */
    get breadcrumbs(): [...LikeC4ViewsFolder<A>[], this];
    /**
     * Returns parent folder
     *
     * @throws Error if this is the root folder.
     */
    get parent(): LikeC4ViewsFolder<A> | null;
    /**
     * Returns sorted set of children
     * - First folders
     * - Then views
     */
    get children(): ReadonlySet<LikeC4ViewsFolder<A> | LikeC4ViewModel<A>>;
    /**
     * Returns sorted array of children folders
     */
    get folders(): ReadonlyArray<LikeC4ViewsFolder<A>>;
    /**
     * Returns all views in this view folder.
     */
    get views(): ReadonlyArray<LikeC4ViewModel<A>>;
}
