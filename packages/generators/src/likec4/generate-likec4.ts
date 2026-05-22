import * as ops from './operators'
import { type AnyOp, type ctxOf, materialize, withctx } from './operators/base'
import { schemas } from './schemas'

type Params = {
  indentation?: string | number
}

export { ops }

export function generateLikeC4(input: schemas.likec4data.Input, params?: Params): string {
  params = {
    indentation: 2,
    ...params,
  }
  return materialize(withctx(input, ops.likec4data()), params.indentation)
}

/**
 * Prints the result of an operation with the data
 *
 * @see ops
 *
 * @example
 * ```ts
 * printOperation(ops.expression(), {
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
 * printOperation(ops.model(), {
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
export function printOperation<Operation extends AnyOp>(operation: Operation): string
export function printOperation<Operation extends AnyOp>(
  operation: Operation,
  data: ctxOf<Operation>,
  params?: Params,
): string
export function printOperation<Operation extends AnyOp>(
  operation: Operation,
  data?: ctxOf<Operation>,
  params?: Params,
): string {
  return materialize(withctx(data ?? {}, operation), params?.indentation)
}

/**
 * Same as {@link printOperation} but uses tab indentation
 */
export function printWithTabIndent<Operation extends AnyOp>(operation: Operation): string
export function printWithTabIndent<Operation extends AnyOp>(
  operation: Operation,
  data: ctxOf<Operation>,
): string
export function printWithTabIndent<Operation extends AnyOp>(
  operation: Operation,
  data?: ctxOf<Operation>,
): string {
  return materialize(withctx(data ?? {}, operation), '\t')
}
