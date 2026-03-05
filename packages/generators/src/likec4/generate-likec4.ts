import * as operators from './operators'
import { type AnyOp, type ctxOf, materialize, withctx } from './operators/base'
import { schemas } from './schemas'

type Params = {
  indentation?: string | number
}

export function generateLikeC4(input: schemas.likec4data.Input, params?: Params): string {
  params = {
    indentation: 2,
    ...params,
  }
  return materialize(withctx(input, operators.likec4data()), params.indentation)
}

/**
 * Prints the result of an operation with the data
 *
 * @see operators
 *
 * @example
 * ```ts
 * print(operators.expression, {
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
 * print(operators.model, {
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
export function print<O extends () => AnyOp>(operator: O, data: ctxOf<O>, params?: Params): string {
  return materialize(withctx(data, operator()), params?.indentation)
}

/**
 * Same as {@link print} but uses tab indentation
 */
export function printTabIndent<O extends () => AnyOp>(operator: O, data: ctxOf<O>): string {
  return materialize(withctx(data, operator()), '\t')
}

export { operators }
