import type { KeysOfUnion } from 'type-fest'
import type { WithDescriptionAndTech } from './_aux'
import type { IsAnyOrNever } from './_common'
import type { MarkdownOrString } from './scalar'

type ExactObject<T, InputType = unknown> =
  // dprint-ignore
  IsAnyOrNever<InputType> extends true
    ? never
    : {
        [KeyType in keyof T]:
          // dprint-ignore
          undefined extends T[KeyType]
            ? T[KeyType] | undefined
            : T[KeyType]
      }
      & Record<Exclude<keyof InputType, KeysOfUnion<T>>, never>

/**
 * Allows only exact properties of `U` to be present in `T` and omits undefined values
 *
 * See {@link Exact} for more details (this version is non-deep)
 */
export function exact<Expected, T extends ExactObject<Expected, T>>(a: T): Expected {
  const entries = [] as [string, unknown][]
  let hasUndefined = false
  for (const [key, value] of Object.entries(a)) {
    if (value === undefined) {
      hasUndefined = true
      continue
    }
    entries.push([key, value])
  }
  if (!hasUndefined) {
    return a as unknown as Expected
  }
  return Object.fromEntries(entries) as Expected
}

/**
 * Returns summary if it is not null, otherwise returns description
 */
/* @__NO_SIDE_EFFECTS__ */
export function preferSummary(a: WithDescriptionAndTech): MarkdownOrString | null | undefined {
  return a.summary ?? a.description
}

/**
 * Returns description if it is not null, otherwise returns summary
 */
/* @__NO_SIDE_EFFECTS__ */
export function preferDescription(a: WithDescriptionAndTech): MarkdownOrString | null | undefined {
  return a.description ?? a.summary
}
