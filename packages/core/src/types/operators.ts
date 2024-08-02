import { isNullish } from 'remeda'
import { nonexhaustive } from '../errors'
import type { NonEmptyArray } from './_common'

export type EqualOperator<V> = {
  eq: V
} | {
  neq: V
}

export interface TagEqual {
  tag: EqualOperator<string>
}
export const isTagEqual = (operator: WhereOperator): operator is TagEqual => {
  return 'tag' in operator
}

export interface KindEqual {
  kind: EqualOperator<string>
}
export const isKindEqual = (operator: WhereOperator): operator is KindEqual => {
  return 'kind' in operator
}

export interface NotOperator<T> {
  not: T
}
export const isNotOperator = (operator: WhereOperator): operator is NotOperator<WhereOperator> => {
  return 'not' in operator
}

export interface AndOperator<T> {
  and: NonEmptyArray<T>
}
export const isAndOperator = (operator: WhereOperator): operator is AndOperator<WhereOperator> => {
  return 'and' in operator
}

export interface OrOperator<T> {
  or: NonEmptyArray<T>
}
export const isOrOperator = (operator: WhereOperator): operator is OrOperator<WhereOperator> => {
  return 'or' in operator
}

export type WhereOperator =
  | TagEqual
  | KindEqual
  | NotOperator<WhereOperator>
  | AndOperator<WhereOperator>
  | OrOperator<WhereOperator>
// type Ops<T> = UnionToIntersection<Op<T>>
// type Op1<T> = RequireExactlyOne<T>

// export type Operator1<T> = T extends Op<T> ? Op1<Ops<T>> : never
// export type Operator = Operator1<any>

// type L = keyof UnionToIntersection<Op<any>>

type Filterable<
  FTag extends string = string,
  FKind extends string = string
> = {
  tags?: FTag[] | null
  kind?: FKind
}

type OperatorPredicate<V extends Filterable> = (value: V) => boolean

export function whereOperatorAsPredicate(operator: WhereOperator): OperatorPredicate<Filterable> {
  switch (true) {
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
      return (value) => !predicate(value)
    }
    case isAndOperator(operator): {
      const predicates = operator.and.map(whereOperatorAsPredicate)
      return (value) => predicates.every((predicate) => predicate(value))
    }
    case isOrOperator(operator): {
      const predicates = operator.or.map(whereOperatorAsPredicate)
      return (value) => predicates.some((predicate) => predicate(value))
    }
    default:
      nonexhaustive(operator)
  }
}
