import type { IsAnyOrNever } from './_common'

/**
 * Determines the stage of the model:
 * 1. `parsed` - parsed from DSL or returned from Builder
 * 2. `computed` - views are computed
 * 3. `layouted` - views are layouted
 *
 * @internal
 */
export type ModelStage = 'parsed' | 'computed' | 'layouted'

export type ExtractOnStage<T, S extends ModelStage> = Extract<T, { [_stage]: S }>

export function isOnStage<T extends { [_stage]: ModelStage }, S extends ModelStage>(
  value: T,
  stage: S,
): value is ExtractOnStage<T, S> {
  return value[_stage] === stage
}

/**
 * Property name to store the stage of the model
 *
 * @internal
 */
export const _stage = '_stage'
export type _stage = typeof _stage

export type inferStage<A> =
  // dprint-ignore
  A extends { ['_stage']: infer S extends ModelStage }
   ? IsAnyOrNever<S> extends true
     ? never
     : S
   : never

/**
 * Property name to store type information, used to identify the type
 * (of the view or view element)
 *
 * @internal
 */
export const _type = '_type'
export type _type = typeof _type

export type inferType<A> =
  // dprint-ignore
  A extends { ['_type']: infer T }
    ? IsAnyOrNever<T> extends true
      ? never
      : T
    : never

/**
 * Property name to store layout type information, used to identify the type of the layout*
 * @internal
 */
export const _layout = '_layout'
export type _layout = typeof _layout

/**
 * Property name to store version information (for migration purposes)
 * @internal
 */
export const _v = '_v'
export type _v = typeof _v
