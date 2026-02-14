import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model';
import type * as t from '@likec4/core/types';
import { useOptionalLikeC4Model } from '../context/LikeC4ModelContext';
type Any = t.aux.Any;
export { useOptionalLikeC4Model, };
/**
 * @returns The LikeC4Model from context.
 * @throws If no LikeC4ModelProvider is found.
 */
export declare function useLikeC4Model<A extends Any = t.aux.UnknownLayouted>(): LikeC4Model<A>;
export declare function useLikeC4ViewModel<A extends Any = t.aux.UnknownLayouted>(viewId: t.aux.ViewId<A>): LikeC4ViewModel<A>;
export declare function useLikeC4Specification(): t.Specification<t.aux.UnknownLayouted>;
