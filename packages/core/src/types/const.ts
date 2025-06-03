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
): value is T & { [_stage]: S } {
  return value[_stage] === stage
}

/**
 * Property name to store the stage of the model
 *
 * @internal
 */
export const _stage = '_stage'
export type _stage = typeof _stage

/**
 * Property name to store type information, used to identify the type of the view
 *
 * @internal
 */
export const _type = '_type'
export type _type = typeof _type
