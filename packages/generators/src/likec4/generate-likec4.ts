import * as ops from './operators'
import { type AnyOp, type ctxOf, materialize } from './operators/base'
import type { schemas } from './schemas'

type Params = {
  indent?: string | number
}

export { ops }

export function generateLikeC4(input: schemas.likec4data.Input, params?: Params): string {
  params = {
    indent: 2,
    ...params,
  }
  return materialize(ops.likec4data(), input, params)
}

/**
 * Prints the result of an operation with the data
 *
 * @see ops
 *
 * @example
 * ```ts
 * print(ops.expression(), {
 *   ref: {
 *     model: 'some.el',
 *   },
 *   selector: 'descendants',
 * })
 * // "some.el.**"
 * ```
 *
 * @example
 * ```ts
 * print(ops.model(), {
 *   elements: [
 *     {
 *       id: 'cloud',
 *       kind: 'system',
 *     },
 *     {
 *       id: 'cloud.mobile',
 *       kind: 'mobileapp',
 *       shape: 'mobile',
 *       color: 'amber',
 *     }
 *   ],
 * })
 * // model {
 * //   cloud = system {
 * //     mobile = mobileapp {
 * //       style {
 * //         shape mobile
 * //         color amber
 * //       }
 * //     }
 * //   }
 * // }
 * ```
 */
export function print(operation: AnyOp): string
export function print<O extends AnyOp>(
  operation: O,
  value: ctxOf<NoInfer<O>>,
  params?: Params,
): string
export function print(
  operation: AnyOp,
  data?: unknown,
  params?: Params,
): string {
  return materialize(operation, data ?? {}, params)
}

/**
 * Same as {@link printOperation} but uses tab indentation
 */
export function printWithTabIndent(operation: AnyOp): string
export function printWithTabIndent<O extends AnyOp>(
  operation: O,
  data: ctxOf<NoInfer<O>>,
): string
export function printWithTabIndent(
  operation: AnyOp,
  data?: unknown,
): string {
  return materialize(operation, data ?? {}, { indent: '\t' })
}
