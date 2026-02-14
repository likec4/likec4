import { LikeC4Model } from '../model';
import { type AnyAux, type aux, type ComputedLikeC4ModelData, type ComputedView, type ParsedLikeC4ModelData, type ParsedView } from '../types';
import type { Any, AnyParsed } from '../types/_aux';
export type ComputeViewResult<V> = {
    isSuccess: true;
    error?: undefined;
    view: V;
} | {
    isSuccess: false;
    error: Error;
    view: undefined;
};
export declare function unsafeComputeView<A extends Any>(viewsource: ParsedView<A>, likec4model: LikeC4Model<any>): ComputedView<A>;
export declare function computeView<A extends Any>(viewsource: ParsedView<A>, likec4model: LikeC4Model<A>): ComputeViewResult<ComputedView<A>>;
export declare function computeParsedModelData<A extends AnyParsed, B extends aux.toComputed<A> = aux.toComputed<A>>(parsed: ParsedLikeC4ModelData<A>): ComputedLikeC4ModelData<B>;
export declare function computeLikeC4Model<A extends AnyAux, B extends aux.toComputed<A> = aux.toComputed<A>>(parsed: ParsedLikeC4ModelData<A>): LikeC4Model<B>;
