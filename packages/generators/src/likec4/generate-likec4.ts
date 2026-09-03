import * as ops from './operators'
import { type AnyOp, type ctxOf, materialize, withctx } from './operators/base'
import { schemas } from './schemas'

type Params = {
  indentation?: string | number
}

export { ops }

/**
 * `schemas.likec4data` (see `./schemas/likec4data.ts`) has no `stories` key, so a plain
 * `zod` parse of the input silently drops any `stories` the caller passed in. Widening the
 * accepted input type here — rather than casting inside the function body — lets us see and
 * reject a non-empty `stories` record before it reaches that lossy parse.
 */
type InputWithStories = schemas.likec4data.Input & {
  stories?: Record<string, unknown>
}

export function generateLikeC4(input: InputWithStories, params?: Params): string {
  if (input.stories && Object.keys(input.stories).length > 0) {
    throw new Error('Story views are not supported by this generator (POC scope)')
  }
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
