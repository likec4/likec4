import { type MarkdownOrString, hasProp, invariant } from '@likec4/core'
import {
  type Generated,
  type GeneratorNode,
  type JoinOptions,
  CompositeGeneratorNode,
  joinToNode,
  NewLineNode,
  NL,
  NLEmpty,
  toString,
} from 'langium/generate'
import {
  filter,
  hasAtLeast,
  identity,
  isArray,
  isBoolean,
  isEmpty,
  isFunction,
  isNonNullish,
  isNullish,
  isNumber,
  isObjectType,
  isString,
  map,
  only,
  pipe,
} from 'remeda'
import { dedent } from 'strip-indent'
import type { IfAny, Or } from 'type-fest'
import z from 'zod/v4'

function hasContent(out: Generated): boolean {
  if (typeof out === 'string') {
    return out.trimStart().length !== 0
  }
  if (out instanceof CompositeGeneratorNode) {
    return out.contents.some(e => hasContent(e))
  }

  return false
}

function hasContentOrNewLine(out: Generated): boolean {
  if (typeof out === 'string') {
    return out.trimStart().length !== 0
  }
  if (out instanceof NewLineNode) {
    return !out.ifNotEmpty
  }

  if (out instanceof CompositeGeneratorNode) {
    return out.contents.some(e => hasContentOrNewLine(e))
  }

  return false
}

export type Output = CompositeGeneratorNode

/**
 * Context for operation, contains the value and target output node
 *
 * @typeParam A - Context value
 * @see executeOnCtx
 */
export type Ctx<A> = {
  ctx: A
  out: Output
}

export type AnyCtx = Ctx<any>

export interface Op<A> {
  (value: Ctx<A>): Ctx<A>
}

export interface CtxOp<A> {
  (value: A): A
}
export type AnyOp = Op<any>

/**
 * Infer the context type from an operation
 */
export type InferOp = <A>(ctx: A) => A

export type ctxOf<O> =
  // dprint-ignore
  O extends Op<infer A>
    ? A
    : O extends (...args: any[]) => Op<infer B>
      ? B
      : never

export type Ops<A> = Op<A>[]

/**
 * Create a new context with the given value and an empty output node
 * @see executeOnFresh
 */
export function fresh<A>(ctx: A): IfAny<A, never, Ctx<A>> {
  return { ctx, out: new CompositeGeneratorNode() } as never
}

/**
 * Materialize context or operation into a string
 */
export function materialize(ctx: AnyCtx | Op<any>, defaultIndentation: string | number = 2): string {
  const out = isFunction(ctx) ? executeOnFresh(undefined, [ctx]).out : ctx.out
  return toString(out, defaultIndentation).replaceAll(/\r\n/g, '\n')
}

/**
 * Execute a sequence of operations on the given context
 * This is reduce operation
 * @see withctx
 */
export function executeOnCtx<A>(
  ctx: Ctx<A>,
  op: Ops<A>,
): Ctx<A>
export function executeOnCtx<A>(
  ctx: Ctx<A>,
  op: Op<A>,
  ...ops: Ops<A>
): Ctx<A>
export function executeOnCtx<A>(
  ctx: Ctx<A>,
  op: Op<A> | Ops<A>,
  ...ops: Ops<A>
): Ctx<A> {
  if (isArray(op)) {
    invariant(ops.length === 0, 'When first argument is an array, no additional operations are allowed')
    ops = op
  } else {
    ops = [op, ...ops]
  }
  for (const o of ops) {
    ctx = o(ctx)
  }
  return ctx
}

/**
 * Execute a sequence of operations on a fresh context (new empty output node)
 * This is reduce operation
 */
export function executeOnFresh<A>(
  ctx: A,
  op: Ops<A>,
): Ctx<A>
export function executeOnFresh<A>(
  ctx: A,
  op: Op<A>,
  ...ops: Ops<A>
): Ctx<A>
export function executeOnFresh<A>(
  ctx: A,
  op: Ops<A> | Op<A>,
  ...ops: Ops<A>
) {
  if (isArray(op)) {
    return executeOnCtx(fresh(ctx), op)
  }
  return executeOnCtx(fresh(ctx), [op, ...ops])
}

/**
 * Execute each operation on a fresh context (new empty output node)
 * This is map operation
 */
export function eachOnFresh<A>(
  ctx: A,
  ops: Ops<A>,
): Ctx<A>[] {
  return ops.map(op => op(fresh(ctx)))
}

/**
 * Create an operation from a function
 * {@link Op} requires return type to be Ctx<A>, this helper does it for us
 */
export function operation<A>(fn: (input: Ctx<A>) => any): Op<A>
export function operation<A>(name: string, fn: (input: Ctx<A>) => any): Op<A>
export function operation(opOrName: string | Function, fn?: Function) {
  const operationFn = typeof opOrName === 'function' ? opOrName : fn!
  const wrapped = (input: Ctx<any>) => {
    const result = operationFn(input)
    if (result instanceof CompositeGeneratorNode) {
      return { ...input, out: result }
    }
    return input
  }
  if (typeof opOrName === 'string' && operationFn.name == '') {
    Object.defineProperties(wrapped, {
      name: { value: `wrapped(${opOrName})` },
    })
  }
  return wrapped
}

function isPrintable(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
/**
 * Prints current context or given parameter.
 * If function is given, it will be called with the current context and the result will be printed (i.e formatted).
 *
 * @example
 * ```ts
 * withctx('value')(
 *   print('const and '),
 *   print(),
 * )
 * // Output: const and value
 * ```
 *
 * * @example
 * ```ts
 * withctx({tag: 'one'})(
 *   print(c => '#' + c.tag)
 * )
 * // Output: #one
 * ```
 */
export function print<A extends string | number | boolean>(): Op<A>
export function print<A>(format: (value: A) => string): Op<A>
export function print(value: string | number | boolean): InferOp
export function print(value?: unknown) {
  return operation(function printOp({ ctx, out }) {
    let v = typeof value === 'function' ? value(ctx) : (value ?? ctx)
    if (isNullish(v) || v === '') {
      return
    }
    invariant(isPrintable(v), 'Value must be a string, number or boolean - got ' + typeof v)
    out.append(String(v))
  })
}

export const eq = (): InferOp => print('=')

export const space = (): InferOp => print(' ')

export function noop(): <A>(input: A) => A {
  return identity()
}

/**
 * To be used for recursive operations
 */
export function lazy<A>(op: () => Op<A>): Op<A> {
  return (input: Ctx<A>) => {
    op()(input)
    return input
  }
}

export function newline(when?: 'ifNotEmpty'): InferOp {
  return operation(({ out }) => {
    if (when === 'ifNotEmpty') {
      out.appendNewLineIfNotEmpty()
    } else {
      out.appendNewLine()
    }
  }) as any
}

/**
 * Merge multiple operations into a single output node
 */
export function merge<A>(...ops: Ops<A>): Op<A> {
  return operation(function merge({ ctx, out }) {
    const nested = executeOnFresh(ctx as A, ops)
    out.appendIf(
      hasContent(nested.out),
      nested.out,
    )
  })
}

/**
 * Indent output of operations
 */
export function indent(value: string): InferOp
export function indent<A>(...args: Ops<A>): Op<A>
export function indent(...args: AnyOp[] | [string]) {
  if (args.length === 1 && typeof args[0] === 'string') {
    const text = dedent(args[0] as string)
    if (text.trimStart().length === 0) {
      return noop()
    }
    return operation(function indent1({ out }) {
      out
        .appendNewLineIfNotEmpty()
        .indent({
          indentEmptyLines: true,
          indentedChildren: [
            joinToNode(
              text.split(/\r?\n/),
              { separator: NL },
            ),
          ],
        })
        .appendNewLineIfNotEmpty()
    })
  }
  const ops = args as Ops<unknown>
  return operation(function indent2({ ctx, out }) {
    const nested = executeOnFresh(ctx, ops)
    if (hasContent(nested.out)) {
      out
        .appendNewLineIfNotEmpty()
        .indent({
          indentEmptyLines: true,
          indentedChildren: nested.out.contents,
        })
        .appendNewLineIfNotEmpty()
    }
  })
}

/**
 * Indent output of operations, join them with newlines and wrap them
 * with `open` and `close` params (`{ .. }` by default)
 *
 * @example
 * ```ts
 * body(
 *   print('name: John'),
 *   print('age: 30'),
 * )
 * // Output:
 * // {
 * //   name: John
 * //   age: 30
 * // }
 * ```
 *
 * @example
 * ```ts
 * body('style')(
 *   print('color: red'),
 *   print('font-size: 12px'),
 * )
 * // Output:
 * // style {
 * //   color: red
 * //   font-size: 12px
 * // }
 * ```
 *
 * @example
 * ```ts
 * body('when [',']')(
 *   print('some condition'),
 * )
 * // Output:
 * // when [
 * //   some condition
 * // ]
 * ```
 */
export function body<A>(...ops: Ops<A>): Op<A>
export function body(keyword: string): <A>(...ops: Ops<A>) => Op<A>
export function body(open: string, close: string): <A>(...ops: Ops<A>) => Op<A>
export function body(...args: unknown[]) {
  const keyword = only(args)
  if (isString(keyword)) {
    return body(keyword + ' {', '}')
  }
  if (args.length === 2 && isString(args[0]) && isString(args[1])) {
    const [open, close] = args as [string, string]
    return (...ops: Ops<any>) =>
      operation(function body({ ctx, out }) {
        const bodyOutput = indent(lines(...ops))(fresh(ctx)).out
        out.appendIf(
          hasContent(bodyOutput),
          joinToNode([
            open,
            bodyOutput,
            close,
          ]),
        )
      })
  }
  const ops = args as Ops<any>
  return body('{', '}')(...ops)
}

const QUOTE = '\''
const ESCAPED_QUOTE = '\\' + QUOTE
/**
 * Append text to the current line, wrapped in single quotes
 * Multiple lines are joined with spaces
 * Escapes single quotes by doubling them
 */
export function inlineText<A extends string>(): Op<A>
export function inlineText<A>(value: string): Op<A>
export function inlineText(value?: string) {
  return operation(({ ctx, out }) => {
    let v = value ?? ctx
    if (isNullish(v)) {
      return
    }
    invariant(isString(v), 'Value must be a string - got ' + typeof v)
    const escapedValue = v
      .replace(/(\r?\n|\t)+/g, ' ')
      .replaceAll(QUOTE, ESCAPED_QUOTE)
      .trim()
    out.append(`${QUOTE}${escapedValue}${QUOTE}`)
  })
}

function multilineText(value: string, quotes = QUOTE): AnyOp {
  return merge(
    print(quotes),
    indent(
      value.replaceAll(QUOTE, ESCAPED_QUOTE),
    ),
    print(quotes),
  )
}

/**
 * Appends text (handles newlines)
 * If the text contains newlines, it is wrapped in double quotes
 *
 * Escapes single quotes by doubling them
 */
export function text<A extends string>(): Op<A>
export function text<A>(format: (value: A) => string): Op<A>
export function text(value: string): InferOp
export function text(value?: unknown) {
  return operation(function text({ ctx, out }) {
    let v = typeof value === 'function' ? value(ctx) : (value ?? ctx)
    if (isNullish(v)) {
      return
    }
    invariant(isString(v), 'Value must be a string - got ' + typeof v)
    if (v.includes('\n')) {
      return multilineText(v)({ ctx: v, out })
    }
    return inlineText()({ ctx: v, out })
  })
}

const TRIPLE_QUOTE = QUOTE.repeat(3)

/**
 * Wraps text in triple quotes (to be transformed to markdown)
 */
export function markdown<A extends string>(): Op<A>
export function markdown<A>(value: string): Op<A>
export function markdown(value?: string) {
  return operation(function markdown(ctx) {
    let v = value ?? ctx.ctx
    if (isNullish(v)) {
      return
    }
    invariant(isString(v), 'Value must be a string - got ' + typeof v)
    return multilineText(v, TRIPLE_QUOTE)(ctx)
  })
}

export function markdownOrString<A extends MarkdownOrString>(): Op<A>
export function markdownOrString<A>(value: MarkdownOrString): Op<A>
export function markdownOrString(value?: MarkdownOrString) {
  return operation<MarkdownOrString>(function markdownOrString(ctx) {
    let v = value ?? ctx.ctx
    if (isNullish(v)) {
      return
    }
    if ('md' in v) {
      return markdown(v.md)(ctx)
    }
    if ('txt' in v) {
      return multilineText(v.txt)(ctx)
    }
    throw new Error('Invalid MarkdownOrString value: ' + v)
  })
}

/**
 * helps to join operations
 *
 * @internal
 *
 * @see spaceBetween
 * @see lines
 * @see foreach
 */
export function join<A>(
  params: {
    operations: Op<A> | Ops<A>
  } & JoinOptions<CompositeGeneratorNode>,
): Op<A> {
  return operation<A>('join', ({ ctx, out }) => {
    const { operations, ...joinOptions } = params
    const ops = Array.isArray(operations) ? operations : [operations]
    invariant(hasAtLeast(ops, 1), 'At least one operation is required')
    let nested
    if (ops.length === 1) {
      const result = ops[0](fresh(ctx))
      nested = result.out.contents as Array<CompositeGeneratorNode>
    } else {
      nested = pipe(
        eachOnFresh(ctx as A, ops),
        map(n => n.out),
      )
    }

    nested = filter(nested, hasContentOrNewLine)

    out.appendIf(
      nested.length > 0,
      joinToNode(
        nested,
        joinOptions,
      ),
    )
  })
}

/**
 * Joins all outputs with a space between
 * @see lines
 */
export function spaceBetween<A>(...ops: Ops<A>): Op<A> {
  return join({
    operations: ops,
    suffix: (node, _index, isLast) => {
      return !isLast && hasContent(node) ? ' ' : undefined
    },
  })
}

/**
 * Joins all outputs from the operations with the specified number of new lines after each operation
 *
 * @see body
 *
 * @example
 * ```ts
 * lines(
 *   print('name'),
 *   print('value'),
 * )
 * // Output:
 * // name
 * // value
 * ```
 *
 * @example
 * ```ts
 * lines(2)(
 *   print('name'),
 *   print('value'),
 * )
 * // Output:
 * // name
 * //
 * // value
 * ```
 */
export function lines<A>(...ops: Ops<A>): Op<A>
export function lines(linesBetween: number): <A>(...ops: Ops<A>) => Op<A>
export function lines(...args: any[]) {
  let linesBetween = only(args)
  if (isNumber(linesBetween)) {
    let suffix = fresh(undefined)
    for (let i = 0; i < linesBetween; i++) {
      suffix.out.appendNewLine()
    }
    return (...ops: Ops<any>) => {
      return join({
        operations: ops,
        suffix: (_node, _index, isLast) => {
          return !isLast ? suffix.out : undefined
        },
      })
    }
  }
  const ops = args as Ops<any>
  return join({
    operations: ops,
    appendNewLineIfNotEmpty: true,
    skipNewLineAfterLastItem: true,
  })
}

/**
 * Forwards the context to the operations
 */
export function withctx<A>(ctx: A): <B>(...ops: Ops<A>) => Op<B>
export function withctx<A, B>(ctx: B, op: Op<B>, ...ops: Ops<B>): Op<A>
export function withctx(...args: unknown[]) {
  const ctx = args[0]
  if (args.length === 1) {
    return (...ops: Ops<any>) =>
      operation(function withctx1({ out }) {
        executeOnCtx({ ctx, out }, ops)
      })
  }
  const ops = args.slice(1) as Ops<any>
  return operation(function withctx2({ out }) {
    executeOnCtx({ ctx, out }, ops)
  })
}

/**
 * Executes the given operation on the property of the context if it is non-nullish
 * If no operation is provided, prints the property name and property value
 * (use {@link printProperty} if you need print value only)
 *
 * @see printProperty
 *
 * @example
 * ```ts
 * withctx({name: 'John'})(
 *   property(
 *    'name',
 *     spaceBetween(
 *       print('Name:'),
 *       print()
 *     )
 *   )
 * )
 * // Output:
 * // Name: John
 * ```
 * @example
 * ```ts
 * withctx({name: 'John'})(
 *   property('name')
 * )
 * // Output:
 * // name John
 * ```
 */
export function property<A, P extends keyof A & string>(
  propertyName: P,
  op?: Op<A[P] & {}>, // NonNullable
): Op<A> {
  return operation(function propertyOp({ ctx, out }) {
    const value = isObjectType(ctx) && hasProp(ctx, propertyName) ? ctx[propertyName] : undefined
    if (value === null || value === undefined) {
      return
    }
    if (!op) {
      invariant(isPrintable(value), `Property ${propertyName} is not printable "${value}"`)
      out.append(propertyName, ' ', String(value))
      return
    }
    op({ ctx: value, out })
  })
}

/**
 * Prints context's property value
 *
 * @see property
 *
 * @example
 * ```ts
 * withctx({name: 'John'})(
 *   printProperty('name')
 * )
 * // Output:
 * // John
 * ```
 */
export function printProperty<A, P extends keyof A & string>(
  propertyName: P,
): Op<A> {
  return property(propertyName, print() as AnyOp)
}

type IterableValue<T> = T extends Iterable<infer U> ? U : never

/**
 * Executes given operation on each item of the iterable context
 * And joins the results with the given options
 * @example
 * ```ts
 *  property(
 *   'tags',
 *   foreach(
 *     print(v => `#${v}`),
 *     separateComma()
 *   ),
 * )
 * ```
 */
export function foreach<A extends Iterable<any>>(
  op: Op<IterableValue<A>>,
): Op<A>
export function foreach<A extends Iterable<any>>(
  op: Op<IterableValue<A>>,
  params: JoinOptions<CompositeGeneratorNode>,
): Op<A>
export function foreach<A extends Iterable<any>>(
  op: Op<IterableValue<A>>,
  ...ops: Ops<IterableValue<A>>
): Op<A>
export function foreach<A extends Iterable<any>>(
  ...args:
    | [op: Op<IterableValue<A>>]
    | [op: Op<IterableValue<A>>, join: JoinOptions<CompositeGeneratorNode>]
    | [op: Op<IterableValue<A>>, ...ops: Ops<IterableValue<A>>]
): Op<A> {
  const [arg1, arg2] = args
  if (args.length === 2 && !isFunction(arg2)) {
    const _op = arg1
    const joinOptions = arg2
    return operation(function foreachSingleOp({ ctx, out }) {
      const items = [] as Array<CompositeGeneratorNode>
      for (const value of ctx) {
        const itemOut = _op(fresh(value)).out
        if (hasContent(itemOut)) {
          items.push(itemOut)
        }
      }
      out.appendIf(
        items.length > 0,
        joinToNode(
          items,
          joinOptions,
        ),
      )
    })
  }
  const ops = args as Ops<IterableValue<A>>
  return operation(({ ctx, out }) => {
    for (const value of ctx) {
      executeOnCtx({ ctx: value, out }, ops)
    }
  })
}

export function separateWith(separator: string | GeneratorNode): JoinOptions<CompositeGeneratorNode> {
  return {
    separator,
  }
}

export function separateNewLine(lines = 1): JoinOptions<CompositeGeneratorNode> {
  if (lines > 1) {
    let suffix = fresh(undefined)
    for (let i = 0; i < lines; i++) {
      suffix.out.appendNewLine()
    }
    return separateWith(suffix.out)
  }
  return separateWith(NL)
}

export function separateComma(addNewLine?: boolean): JoinOptions<CompositeGeneratorNode> {
  if (addNewLine) {
    return {
      separator: ',',
      appendNewLineIfNotEmpty: true,
      skipNewLineAfterLastItem: true,
    }
  }
  return {
    separator: ', ',
  }
}

/**
 * Executes given operations on each item of the iterable context
 * And joins the results with a new line
 */
export function foreachNewLine<A extends Iterable<any>>(
  ...ops: Ops<IterableValue<A>>
): Op<A> {
  return operation(function foreachNewLineOp({ ctx, out }) {
    const items = [] as Array<CompositeGeneratorNode>
    for (const value of ctx) {
      const itemOut = executeOnFresh(value, ops).out
      if (hasContent(itemOut)) {
        items.push(itemOut)
      }
    }
    out.appendIf(
      items.length > 0,
      joinToNode(
        items,
        separateNewLine(),
      ),
    )
  })
}

/**
 * Guards context value with a condition and executes operations if the condition is true
 */
export function guard<A, N extends A>(
  condition: (ctx: A) => ctx is N,
  ...ops: Ops<N>
): Op<A>
export function guard<A, Z extends z.ZodType<any, any, any>>(
  zodSchema: Z,
  ...ops: Or<
    A extends z.input<NoInfer<Z>> ? true : false,
    z.input<NoInfer<Z>> extends A ? true : false
  > extends true ? Ops<z.output<NoInfer<Z>>> : ['zod guard mismatch']
): Op<A>
export function guard(
  condition: Function | z.ZodSchema,
  ...ops: Ops<any>
) {
  return operation('guard', ({ ctx, out }) => {
    if ('safeParse' in condition) {
      const parsed = condition.safeParse(ctx)
      if (parsed.success) {
        executeOnCtx({ ctx: parsed.data, out }, ops)
      } else {
        throw new Error(`Guard failed: ${z.prettifyError(parsed.error)}`)
      }
      return
    }
    invariant(typeof condition === 'function')
    if (condition(ctx)) {
      executeOnCtx({ ctx, out }, ops)
      return
    }
  })
}

/**
 * Executes operations on the context if the condition is true
 */
export function when<A>(
  condition: (ctx: A) => boolean,
  ...ops: Ops<NoInfer<A>>
): Op<A> {
  return operation(function whenOp({ ctx, out }) {
    if (condition(ctx)) {
      executeOnCtx({ ctx, out }, ops)
    }
  })
}

export function select<A, B>(
  selector: (value: A) => B,
  ...ops: Ops<B & {}> // NonNullable
): Op<A> {
  return operation(function selectOp({ ctx, out }) {
    const value = selector(ctx)
    if (isNonNullish(value)) {
      executeOnCtx({ ctx: value, out }, ops)
    }
  })
}
