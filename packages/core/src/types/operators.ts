import { allPass, anyPass, isNot, isNullish } from 'remeda'
import { nonexhaustive } from '../errors'
import type { NonEmptyArray } from './_common'
import type * as aux from './aux'
import type { AnyAux, Unknown } from './aux'

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
}

export type TagEqual<A extends AnyAux> = Omit<AllNever, 'tag'> & {
  tag: EqualOperator<aux.loose.Tag<A>>
}
export function isTagEqual<A extends AnyAux>(operator: WhereOperator<A>): operator is TagEqual<A> {
  return 'tag' in operator
}

export type KindEqual<A extends AnyAux> = Omit<AllNever, 'kind'> & {
  kind: EqualOperator<aux.loose.ElementKind<A> | aux.DeploymentKind<A> | aux.RelationKind<A>>
}
export function isKindEqual<A extends AnyAux>(operator: WhereOperator<A>): operator is KindEqual<A> {
  return 'kind' in operator
}

export type Participant = 'source' | 'target'
export type ParticipantOperator<A extends AnyAux> = Omit<AllNever, 'participant'> & {
  participant: Participant
  operator: KindEqual<A> | TagEqual<A>
}
export function isParticipantOperator<A extends AnyAux>(
  operator: WhereOperator<A>,
): operator is ParticipantOperator<A> {
  return 'participant' in operator
}

export type NotOperator<A extends AnyAux> = Omit<AllNever, 'not'> & {
  not: WhereOperator<A>
}
export function isNotOperator<A extends AnyAux>(operator: WhereOperator<A>): operator is NotOperator<A> {
  return 'not' in operator
}

export type AndOperator<A extends AnyAux> = Omit<AllNever, 'and'> & {
  and: NonEmptyArray<WhereOperator<A>>
}
export function isAndOperator<A extends AnyAux>(operator: WhereOperator<A>): operator is AndOperator<A> {
  return 'and' in operator
}

export type OrOperator<A extends AnyAux> = Omit<AllNever, 'or'> & {
  or: NonEmptyArray<WhereOperator<A>>
}
export function isOrOperator<A extends AnyAux>(operator: WhereOperator<A>): operator is OrOperator<A> {
  return 'or' in operator
}

export type WhereOperator<A extends AnyAux = Unknown> =
  | TagEqual<A>
  | KindEqual<A>
  | ParticipantOperator<A>
  | NotOperator<A>
  | AndOperator<A>
  | OrOperator<A>

export type Filterable<A extends AnyAux> = {
  tags?: aux.loose.Tags<A> | null | undefined
  kind?: aux.loose.ElementKind<A> | aux.loose.DeploymentKind<A> | aux.loose.RelationKind<A> | null
  source?: Filterable<A>
  target?: Filterable<A>
}

export type OperatorPredicate<A extends AnyAux> = (value: Filterable<A>) => boolean

export function whereOperatorAsPredicate<A extends AnyAux = Unknown>(
  operator: WhereOperator<A>,
): OperatorPredicate<A> {
  switch (true) {
    case isParticipantOperator(operator): {
      const participant = operator.participant
      const participantPredicate = whereOperatorAsPredicate(operator.operator)

      return participantIs(participant, participantPredicate)
    }
    case isTagEqual(operator): {
      if ('eq' in operator.tag) {
        const tag = operator.tag.eq
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
      if ('eq' in operator.kind) {
        const kind = operator.kind.eq
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

function participantIs<A extends AnyAux>(
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
