import { type MarkdownOrString, hasProp } from '@likec4/core'
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
import type { IfAny } from 'type-fest'

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
 */
export function executeOnCtx<A>(
  ctx: Ctx<A>,
  ops: Ops<A>,
): Ctx<A> {
  for (const op of ops) {
    ctx = op(ctx)
  }
  return ctx
}

/**
 * Execute a sequence of operations on a fresh context (new empty output node)
 * This is reduce operation
 */
export function executeOnFresh<A>(
  ctx: A,
  ops: Ops<A>,
): Ctx<A> {
  return executeOnCtx(fresh(ctx), ops)
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

// type CastedCtx<C> = IsAny<C> extends true ? Ctx<unknown> : Ctx<C>
type CastedCtx<C> = Ctx<C>

/**
 * Create an operation from a function
 */
export function operation<A>(fn: (input: CastedCtx<A>) => any): Op<A>
export function operation<A>(name: string, fn: (input: CastedCtx<A>) => any): Op<A>
export function operation(opOrName: string | Function, fn?: Function) {
  const name = typeof opOrName === 'string' ? opOrName : 'anonymous operation'
  const operationFn = typeof opOrName === 'function' ? opOrName : fn!
  const wrapped = (input: Ctx<any>) => {
    const result = operationFn(input)
    if (result instanceof CompositeGeneratorNode) {
      return { ...input, out: result }
    }
    return input
  }
  Object.defineProperties(wrapped, {
    length: { value: operationFn.length },
    name: { value: name },
  })
  return wrapped
}

/**
 * Prints current context to the output node
 */
export function print<A extends string | number | boolean>(): Op<A>
/**
 * Prints the given string to the output node
 */
export function print<A>(format: (value: A) => string): Op<A>
export function print(value: string | number | boolean): InferOp
export function print(value?: unknown) {
  return operation(({ ctx, out }) => {
    let v = typeof value === 'function' ? value(ctx) : (value ?? ctx)
    if (isNullish(v)) {
      return
    }
    if (isString(v) || isNumber(v) || isBoolean(v)) {
      out.append(String(v))
      return
    }
    throw new Error('Value must be a string, number or boolean - got ' + typeof v)
  })
}

export const eq = (): InferOp => print('=')

export const keyword = (value: string): InferOp => print(value)

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
  return operation('merge', ({ ctx, out }) => {
    const nested = executeOnFresh(ctx as A, ops)
    out.appendIf(
      hasContent(nested.out),
      nested.out,
    )
  })
}

/**
 * Indent given text
 */
export function indent(value: string): InferOp
/**
 * Indent the given operations
 */
export function indent<A>(...args: Ops<A>): Op<A>
export function indent(...args: AnyOp[] | [string]) {
  if (args.length === 1 && typeof args[0] === 'string') {
    const text = dedent(args[0] as string)
    return operation('indent', ({ out }) => {
      if (isEmpty(text.trimStart())) {
        return
      }
      out.indent({
        indentImmediately: false,
        indentedChildren: [
          NLEmpty,
          joinToNode(
            text.split(/\r?\n/),
            { separator: NL },
          ),
          NLEmpty,
        ],
      })
    })
  }
  const ops = args as Ops<unknown>
  return operation('indent', ({ ctx, out }) => {
    const nested = executeOnFresh(ctx, ops)
    if (hasContent(nested.out)) {
      out.indent({
        indentImmediately: false,
        indentedChildren: [
          NLEmpty,
          nested.out,
          NLEmpty,
        ],
      })
    }
  })
}

export function body<A>(...ops: Ops<A>): Op<A>
/**
 * Indent the given operations and wrap them in '{ ... }'
 */
export function body(keyword: string): <A>(...ops: Ops<A>) => Op<A>
/**
 * Indent the given operations and wrap them with the provided open and close strings
 */
export function body(open: string, close: string): <A>(...ops: Ops<A>) => Op<A>
export function body(...args: unknown[]) {
  const keyword = only(args)
  if (isString(keyword)) {
    return body(keyword + ' {', '}')
  }
  if (args.length === 2 && isString(args[0]) && isString(args[1])) {
    const [open, close] = args as [string, string]
    return (...ops: Ops<any>) =>
      operation('body ' + open + ' ' + close, ({ ctx, out }) => {
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

/**
 * Append text to the current line, wrapped in single quotes
 * Multiple lines are joined with newlines
 * Escapes single quotes by doubling them
 */
const QUOTE = '\''
const ESCAPED_QUOTE = '\\' + QUOTE
export function inlineText<A extends string>(): Op<A>
export function inlineText<A>(value: string): Op<A>
export function inlineText(value?: string) {
  return operation(({ ctx, out }) => {
    let v = value ?? ctx
    if (isNullish(v) || !isString(v)) {
      return
    }
    const escapedValue = v
      .replace(/(\r?\n|\t)+/g, ' ')
      .replaceAll(QUOTE, ESCAPED_QUOTE)
      .trim()
    out.append(`${QUOTE}${escapedValue}${QUOTE}`)
  })
}

function multilineText(value: string, quotes = DOUBLE_QUOTE): AnyOp {
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
const DOUBLE_QUOTE = QUOTE.repeat(2)
export function text<A extends string>(): Op<A>
export function text<A>(format: (value: A) => string): Op<A>
export function text(value: string): InferOp
export function text(value?: unknown) {
  return operation('text', ({ ctx, out }) => {
    let v = typeof value === 'function' ? value(ctx) : (value ?? ctx)
    if (isNullish(v) || !isString(v)) {
      return
    }
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
  return operation('markdown', (ctx) => {
    let v = value ?? ctx.ctx
    if (isNullish(v) || !isString(v)) {
      return
    }
    return multilineText(v, TRIPLE_QUOTE)(ctx)
  })
}

export function markdownOrString<A extends MarkdownOrString>(): Op<A>
export function markdownOrString<A>(value: MarkdownOrString): Op<A>
export function markdownOrString(value?: MarkdownOrString) {
  return operation<MarkdownOrString>('markdownOrString', ctx => {
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
 * Cast the given operation to a context operation
 */
export function join<A>(
  params: {
    operations: Op<A> | Ops<A>
  } & JoinOptions<CompositeGeneratorNode>,
): Op<A> {
  return operation<A>('join', ({ ctx, out }) => {
    const { operations, ...joinOptions } = params
    const ops = Array.isArray(operations) ? operations : [operations]
    if (!hasAtLeast(ops, 1)) {
      return
    }

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
 * Joins all outputs with a space between
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
        appendNewLineIfNotEmpty: true,
        skipNewLineAfterLastItem: true,
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
 * Forwards the given context to the given operations
 */
export function withctx<A>(ctx: A): <B>(...ops: Ops<A>) => Op<B>
export function withctx<A, B>(ctx: B, op: Op<B>, ...ops: Ops<B>): Op<A>
export function withctx(...args: unknown[]) {
  const ctx = args[0]
  if (args.length === 1) {
    return (...ops: Ops<any>) =>
      operation('withctx', ({ out }) => {
        executeOnCtx({ ctx, out }, ops)
      })
  }
  const ops = args.slice(1) as Ops<any>
  return operation('withctx', ({ out }) => {
    executeOnCtx({ ctx, out }, ops)
  })
}

/**
 * Executes the given operation on the property of the context if it is non-nullish
 */
export function property<A, P extends keyof A & string>(
  propertyName: P,
  op?: Op<A[P] & {}>, // NonNullable
): Op<A> {
  return operation(`property-${propertyName}`, ({ ctx, out }) => {
    const value = isObjectType(ctx) && hasProp(ctx, propertyName) ? ctx[propertyName] : undefined
    if (value !== undefined && value !== null) {
      if (!op) {
        print()({ ctx: value as any, out })
        return
      }

      op({ ctx: value, out })
    }
  })
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
/**
 * Executes given operations on each item of the iterable context
 */
// export function foreach<A extends Iterable<any>>(op: Op<IterableValue<A>>, ...ops: Ops<IterableValue<A>>): Op<A>
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
    return operation('foreach', ({ ctx, out }) => {
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

export function separateComma(): JoinOptions<CompositeGeneratorNode> {
  return separateWith(', ')
}

/**
 * Executes given operations on each item of the iterable context
 * And joins the results with a new line
 */
export function foreachNewLine<A extends Iterable<any>>(
  ...ops: Ops<IterableValue<A>>
): Op<A> {
  return operation('foreachNewLine', ({ ctx, out }) => {
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
): Op<A> {
  return operation('guard', ({ ctx, out }) => {
    if (condition(ctx)) {
      executeOnCtx({ ctx, out }, ops)
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
  return operation('when', ({ ctx, out }) => {
    if (condition(ctx)) {
      executeOnCtx({ ctx, out }, ops)
    }
  })
}

export function select<A, B>(
  selector: (value: NoInfer<A>) => B,
  ...ops: Ops<B & {}> // NonNullable
): Op<A> {
  return operation('select', ({ ctx, out }) => {
    const value = selector(ctx)
    if (isNonNullish(value)) {
      executeOnCtx({ ctx: value, out }, ops)
    }
  })
}
