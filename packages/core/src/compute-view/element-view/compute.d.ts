import { LikeC4Model } from '../../model/LikeC4Model';
import { type AnyAux, type ComputedElementView, type ElementViewRule, type ParsedElementView } from '../../types';
import { Memory } from './memory';
export declare function processPredicates<A extends AnyAux>(model: LikeC4Model<A>, memory: Memory, rules: ElementViewRule<A>[]): Memory;
export declare function computeElementView<A extends AnyAux>(likec4model: LikeC4Model<any>, { docUri: _docUri, // exclude docUri
rules: _rules, // exclude rules
...view }: ParsedElementView<A>): ComputedElementView<A>;
