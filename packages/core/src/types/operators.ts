import { allPass, anyPass, isNot, isNullish } from 'remeda'
import { nonexhaustive } from '../errors'
import type { NonEmptyArray } from './_common'

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

export type TagEqual<Tag> = Omit<AllNever, 'tag'> & {
  tag: EqualOperator<Tag>
}
export const isTagEqual = <Tag>(operator: WhereOperator<Tag, any>): operator is TagEqual<Tag> => {
  return 'tag' in operator
}

export type KindEqual<Kind> = Omit<AllNever, 'kind'> & {
  kind: EqualOperator<Kind>
}
export const isKindEqual = <Kind>(operator: WhereOperator<any, Kind>): operator is KindEqual<Kind> => {
  return 'kind' in operator
}

export type Participant = 'source' | 'target'
export type ParticipantOperator<Tag, Kind> = Omit<AllNever, 'participant'> & {
  participant: Participant
  operator: KindEqual<Kind> | TagEqual<Tag>
}
export const isParticipantOperator = <Tag, Kind>(
  operator: WhereOperator<Tag, any>
): operator is ParticipantOperator<Tag, Kind> => {
  return 'participant' in operator
}

export type NotOperator<Tag, Kind> = Omit<AllNever, 'not'> & {
  not: WhereOperator<Tag, Kind>
}
export const isNotOperator = <Tag, Kind>(operator: WhereOperator<Tag, Kind>): operator is NotOperator<Tag, Kind> => {
  return 'not' in operator
}

export type AndOperator<Tag, Kind> = Omit<AllNever, 'and'> & {
  and: NonEmptyArray<WhereOperator<Tag, Kind>>
}
export const isAndOperator = <Tag, Kind>(operator: WhereOperator<Tag, Kind>): operator is AndOperator<Tag, Kind> => {
  return 'and' in operator
}

export type OrOperator<Tag, Kind> = Omit<AllNever, 'or'> & {
  or: NonEmptyArray<WhereOperator<Tag, Kind>>
}
export const isOrOperator = <Tag, Kind>(operator: WhereOperator<Tag, Kind>): operator is OrOperator<Tag, Kind> => {
  return 'or' in operator
}

export type WhereOperator<Tag, Kind> =
  | TagEqual<Tag>
  | KindEqual<Kind>
  | ParticipantOperator<Tag, Kind>
  | NotOperator<Tag, Kind>
  | AndOperator<Tag, Kind>
  | OrOperator<Tag, Kind>

export type Filterable<
  FTag extends string | null = string | null,
  FKind extends string | null = string | null,
> = {
  tags?: readonly FTag[] | null
  kind?: FKind
  source?: Filterable<FTag, FKind>
  target?: Filterable<FTag, FKind>
}

export type OperatorPredicate<V extends Filterable> = (value: V) => boolean

export function whereOperatorAsPredicate<
  FTag extends string | null = string | null,
  FKind extends string | null = string | null,
>(operator: WhereOperator<FTag, FKind>): OperatorPredicate<Filterable> {
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
          return Array.isArray(value.tags) && value.tags.includes(tag as FTag)
        }
      }
      const tag = operator.tag.neq
      return (value) => {
        return !Array.isArray(value.tags) || !value.tags.includes(tag as FTag)
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

function participantIs<FTag extends string | null, FKind extends string | null>(
  participant: Participant,
  predicate: OperatorPredicate<Filterable<FTag, FKind>>
): OperatorPredicate<Filterable<FTag, FKind>> {
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
