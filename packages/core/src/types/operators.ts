import { allPass, anyPass, isNot, isNullish, isString } from 'remeda'
import { nonexhaustive } from '../errors'
import type { NonEmptyArray } from './_common'
import type * as aux from './aux'
import type { Any } from './aux'

export type EqualOperator<V> = {
  eq: V
  neq?: never
} | {
  eq?: never
  neq: V
}

type AllNever = {
  not?: never
  and?: never
  or?: never
  tag?: never
  kind?: never
  participant?: never
  operator?: never
}

export type TagEqual<A extends Any> = Omit<AllNever, 'tag'> & {
  tag: EqualOperator<aux.Tag<A>> | aux.Tag<A>
}
export function isTagEqual<A extends Any>(operator: WhereOperator<A>): operator is TagEqual<A> {
  return 'tag' in operator
}

export type KindEqual<A extends Any> = Omit<AllNever, 'kind'> & {
  kind: EqualOperator<aux.AllKinds<A>> | aux.AllKinds<A>
}
export function isKindEqual<A extends Any>(operator: WhereOperator<A>): operator is KindEqual<A> {
  return 'kind' in operator
}

export type Participant = 'source' | 'target'
export type ParticipantOperator<A extends Any> = Omit<AllNever, 'participant' | 'operator'> & {
  participant: Participant
  operator: KindEqual<A> | TagEqual<A>
}
export function isParticipantOperator<A extends Any>(
  operator: WhereOperator<A>,
): operator is ParticipantOperator<A> {
  return 'participant' in operator
}

export type NotOperator<A extends Any> = Omit<AllNever, 'not'> & {
  not: WhereOperator<A>
}
export function isNotOperator<A extends Any>(operator: WhereOperator<A>): operator is NotOperator<A> {
  return 'not' in operator
}

export type AndOperator<A extends Any> = Omit<AllNever, 'and'> & {
  and: NonEmptyArray<WhereOperator<A>>
}
export function isAndOperator<A extends Any>(operator: WhereOperator<A>): operator is AndOperator<A> {
  return 'and' in operator
}

export type OrOperator<A extends Any> = Omit<AllNever, 'or'> & {
  or: NonEmptyArray<WhereOperator<A>>
}
export function isOrOperator<A extends Any>(operator: WhereOperator<A>): operator is OrOperator<A> {
  return 'or' in operator
}

export type WhereOperator<A extends Any = Any> =
  | TagEqual<A>
  | KindEqual<A>
  | ParticipantOperator<A>
  | NotOperator<A>
  | AndOperator<A>
  | OrOperator<A>

export type Filterable<A extends Any> = {
  tags?: aux.Tags<A> | null | undefined
  kind?: aux.AllKinds<A> | null | undefined
  source?: Filterable<A>
  target?: Filterable<A>
}

export type OperatorPredicate<A extends Any> = (value: Filterable<A>) => boolean

export function whereOperatorAsPredicate<A extends Any>(
  operator: WhereOperator<A>,
): OperatorPredicate<A> {
  switch (true) {
    case isParticipantOperator(operator): {
      const participant = operator.participant
      const participantPredicate = whereOperatorAsPredicate(operator.operator)

      return participantIs(participant, participantPredicate)
    }
    case isTagEqual(operator): {
      if (isString(operator.tag) || 'eq' in operator.tag) {
        const tag = isString(operator.tag) ? operator.tag : operator.tag.eq
        return (value) => {
          return Array.isArray(value.tags) && value.tags.includes(tag)
        }
      }
      const tag = operator.tag.neq
      return (value) => {
        return !Array.isArray(value.tags) || !value.tags.includes(tag)
      }
    }
    case isKindEqual(operator): {
      if (isString(operator.kind) || 'eq' in operator.kind) {
        const kind = isString(operator.kind) ? operator.kind : operator.kind.eq
        return (value) => {
          return value.kind === kind
        }
      }
      const kind = operator.kind.neq
      return (value) => {
        return isNullish(value.kind) || value.kind !== kind
      }
    }
    case isNotOperator(operator): {
      const predicate = whereOperatorAsPredicate(operator.not)
      return isNot(predicate)
    }
    case isAndOperator(operator): {
      const predicates = operator.and.map(whereOperatorAsPredicate)
      return allPass(predicates)
    }
    case isOrOperator(operator): {
      const predicates = operator.or.map(whereOperatorAsPredicate)
      return anyPass(predicates)
    }
    default:
      nonexhaustive(operator)
  }
}

function participantIs<A extends Any>(
  participant: Participant,
  predicate: OperatorPredicate<A>,
): OperatorPredicate<A> {
  return (value) => {
    if (!value.source || !value.target) {
      return false
    }
    switch (participant) {
      case 'source': {
        return predicate(value.source)
      }
      case 'target': {
        return predicate(value.target)
      }
    }
  }
}
