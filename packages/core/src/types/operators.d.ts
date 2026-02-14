import type * as aux from './_aux';
import type { Any } from './_aux';
import type { NonEmptyArray } from './_common';
export type EqualOperator<V> = {
    eq: V;
    neq?: never;
} | {
    eq?: never;
    neq: V;
};
type AllNever = {
    not?: never;
    and?: never;
    or?: never;
    tag?: never;
    kind?: never;
    participant?: never;
    operator?: never;
};
export type TagEqual<A extends Any> = Omit<AllNever, 'tag'> & {
    tag: EqualOperator<aux.Tag<A>> | aux.Tag<A>;
};
export declare function isTagEqual<A extends Any>(operator: WhereOperator<A>): operator is TagEqual<A>;
export type KindEqual<A extends Any> = Omit<AllNever, 'kind'> & {
    kind: EqualOperator<aux.AllKinds<A>> | aux.AllKinds<A>;
};
export declare function isKindEqual<A extends Any>(operator: WhereOperator<A>): operator is KindEqual<A>;
export type Participant = 'source' | 'target';
export type ParticipantOperator<A extends Any> = Omit<AllNever, 'participant' | 'operator'> & {
    participant: Participant;
    operator: KindEqual<A> | TagEqual<A>;
};
export declare function isParticipantOperator<A extends Any>(operator: WhereOperator<A>): operator is ParticipantOperator<A>;
export type NotOperator<A extends Any> = Omit<AllNever, 'not'> & {
    not: WhereOperator<A>;
};
export declare function isNotOperator<A extends Any>(operator: WhereOperator<A>): operator is NotOperator<A>;
export type AndOperator<A extends Any> = Omit<AllNever, 'and'> & {
    and: NonEmptyArray<WhereOperator<A>>;
};
export declare function isAndOperator<A extends Any>(operator: WhereOperator<A>): operator is AndOperator<A>;
export type OrOperator<A extends Any> = Omit<AllNever, 'or'> & {
    or: NonEmptyArray<WhereOperator<A>>;
};
export declare function isOrOperator<A extends Any>(operator: WhereOperator<A>): operator is OrOperator<A>;
export type WhereOperator<A extends Any = Any> = TagEqual<A> | KindEqual<A> | ParticipantOperator<A> | NotOperator<A> | AndOperator<A> | OrOperator<A>;
export type Filterable<A extends Any> = {
    tags?: aux.Tags<A> | null | undefined;
    kind?: aux.AllKinds<A> | null | undefined;
    source?: Filterable<A>;
    target?: Filterable<A>;
};
export type OperatorPredicate<A extends Any> = (value: Filterable<A>) => boolean;
export declare function whereOperatorAsPredicate<A extends Any>(operator: WhereOperator<A>): OperatorPredicate<A>;
export {};
