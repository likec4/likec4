import { Builder } from '../../builder/Builder';
import { LikeC4Model } from '../LikeC4Model';
declare const local: Builder<import("../../builder/_types").Types<KeysOf<T>, string, "index" | "cloud" | "prod", KeysOf<T>, KeysOf<T>, TupleToUnion<Spec["metadataKeys"]>, KeysOf<T>, string>>;
export declare const builder: Builder<import("../../builder/_types").Types<KeysOf<T>, string, "index" | "cloud" | "prod", KeysOf<T>, KeysOf<T>, TupleToUnion<Spec["metadataKeys"]>, KeysOf<T>, string>>;
export declare const parsed: ParsedLikeC4ModelData<import("../../builder/_types").Types.ToAux<T>>;
export type TestFqn = typeof local.Types.Fqn;
export declare const computed: ComputedLikeC4ModelData<B>;
export declare const model: LikeC4Model<import("../../types/_aux").AnyParsed>;
export {};
