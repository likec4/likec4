type NonEmptyArray<T> = [T, ...T[]]

type EqualOperator<V> = {
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
}

type TagKindOperator<Tag, Kind> =
  & Omit<AllNever, 'tag' | 'kind'>
  & ({
    tag: EqualOperator<Tag>
    kind?: never
  } | {
    tag?: never
    kind: EqualOperator<Kind>
  })

type NotOperator<Tag, Kind> = Omit<AllNever, 'not'> & {
  not: TagKindOperator<Tag, Kind> | AndOperator<Tag, Kind> | OrOperator<Tag, Kind>
}

type AndOperator<Tag, Kind> = Omit<AllNever, 'and'> & {
  and: NonEmptyArray<
    | TagKindOperator<Tag, Kind>
    | OrOperator<Tag, Kind>
    | NotOperator<Tag, Kind>
  >
}

type OrOperator<Tag, Kind> = Omit<AllNever, 'or'> & {
  or: NonEmptyArray<
    | TagKindOperator<Tag, Kind>
    | AndOperator<Tag, Kind>
    | NotOperator<Tag, Kind>
  >
}

// export const isOrOperator = (operator: WhereOperator): operator is OrOperator<WhereOperator> => {
//   return 'or' in operator
// }

export type WhereOperator<Tag extends string, Kind extends string> =
  | TagKindOperator<Tag, Kind>
  | NotOperator<Tag, Kind>
  | AndOperator<Tag, Kind>
  | OrOperator<Tag, Kind>
