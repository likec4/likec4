import type { LikeC4Model } from '../../model';
import type { AnyAux } from '../../types';
import { type ComputedDynamicView, type ParsedDynamicView as DynamicView } from '../../types';
export declare function computeDynamicView<M extends AnyAux>(model: LikeC4Model<M>, view: DynamicView<M>): ComputedDynamicView<M>;
