import { type Element, type MarkdownOrString, nameFromFqn } from '@likec4/core'
import {
  type GeneratorNode,
  type JoinOptions,
  CompositeGeneratorNode,
  joinToNode,
  NL,
  NLEmpty,
  toString,
} from 'langium/generate'
import {
  filter,
  isEmptyish,
  isFunction,
  isNonNullish,
  isNullish,
  isString,
  map,
  pipe,
  piped,
} from 'remeda'
import { dedent } from 'strip-indent'
import type { ConditionalKeys } from 'type-fest'

function hasContent(node: GeneratorNode | string): boolean {
  if (typeof node === 'string') {
    return node.trim().length !== 0
  } else if (node instanceof CompositeGeneratorNode) {
    return node.contents.some(e => hasContent(e))
  } else {
    return false
  }
}

export function PrintCtx<A = unknown>(context?: {
  value: A
  out?: CompositeGeneratorNode
}): PrintCtx<A> {
  const value = context?.value
  const out = context?.out ?? new CompositeGeneratorNode()

  const ctx = new Proxy(out, {
    get(target, p, receiver) {
      if (p === 'toString') {
        return () => toString(target, 2)
      }
      if (p === 'value') {
        return value
      }
      if (p === 'out') {
        return out
      }
      if (p === 'fresh') {
        return () => PrintCtx({ value, out: new CompositeGeneratorNode() })
      }
      if (p === 'hasContent') {
        return () => hasContent(out)
      }
      if (p === 'isEmpty') {
        return () => !hasContent(out)
      }
      return target[p as keyof CompositeGeneratorNode]
    },
  })
  return ctx as PrintCtx<A>
}

export type PrintCtx<A = unknown> = CompositeGeneratorNode & {
  value: A
  out: CompositeGeneratorNode
  /**
   * Checks if the output node has any content
   */
  hasContent: () => boolean

  /**
   * Checks if the output node is empty
   */
  isEmpty: () => boolean

  toString: () => string
}

type AnyCtx = PrintCtx<any>

function fresh<A extends AnyCtx>(ctx: A): A {
  return PrintCtx({ value: ctx.value, out: new CompositeGeneratorNode() }) as A
}

export type Op<A> = (ctx: A) => A
export type PrintOp<A> = (ctx: PrintCtx<A>) => PrintCtx<A>

export type Ops<A = unknown> = Op<A>[]

export function execOps<A extends AnyCtx>(ctx: A, ops: Ops<A>): A {
  for (const op of ops) {
    ctx = op(ctx)
  }
  return ctx
}

export function keyword(value: string): <A extends AnyCtx>(ctx: A) => A {
  return (ctx) => {
    ctx.append(value)
    return ctx
  }
}

export function space(): <A extends AnyCtx>(ctx: A) => A {
  return (ctx) => {
    ctx.append(' ')
    return ctx
  }
}

export function print<A extends PrintCtx<string>>(): Op<A>
export function print<A extends PrintCtx>(format: (value: A['value']) => string): Op<A>
export function print(value: string): <A extends AnyCtx>(ctx: A) => A
export function print(value?: string | ((value: any) => string)) {
  return (ctx: AnyCtx) => {
    let v = value ?? ctx.value
    if (isFunction(value)) {
      v = value(ctx.value)
    }
    if (isNullish(v)) {
      return ctx
    }
    if (!isString(v)) {
      throw new Error('Value must be a string - got ' + typeof v)
    }
    ctx.append(v)
    return ctx
  }
}

export function eq(): <A extends AnyCtx>(ctx: A) => A {
  return (ctx) => {
    ctx.append('=')
    return ctx
  }
}

export function newline<A extends AnyCtx>(when: 'always' | 'ifNotEmpty' = 'ifNotEmpty'): Op<A> {
  return (ctx) => {
    if (when === 'ifNotEmpty') {
      ctx.appendNewLineIfNotEmpty()
    } else {
      ctx.appendNewLine()
    }
    return ctx
    // if (ctx.line.isEmpty() && when !== 'always') {
    //   return ctx
    // }
    // ctx.newline()
    // return ctx
  }
}

export function id<A extends PrintCtx<{ id: string }>>(): Op<A> {
  return (ctx) => {
    ctx.append(ctx.value.id)
    return ctx
  }
}

export function printprop<
  A extends AnyCtx,
  P extends keyof A['value'],
>(key: P): Op<A> {
  return (ctx) => {
    const value = ctx.value[key]
    if (isNullish(value)) {
      return ctx
    }
    ctx.append(String(value))
    return ctx
  }
}

export function nameFromId<A extends PrintCtx<{ id: string }>>(): Op<A> {
  return (ctx) => {
    ctx.append(nameFromFqn(ctx.value.id))
    return ctx
  }
}

export function kind<A extends PrintCtx<{ kind: string }>>(): Op<A> {
  return (ctx) => {
    ctx.append(ctx.value.kind)
    return ctx
  }
}

export function title<A extends PrintCtx<{ title: string }>>(): Op<A> {
  return (ctx) => {
    return inlineText(ctx.value.title)(ctx)
  }
}

export function tags<A extends PrintCtx<{ tags?: Iterable<string> | null }>>(): Op<A> {
  return select(
    (ctx) => (ctx.tags ?? []) as string[],
    each({
      prefix: '#',
      separator: ', ',
      print: print(),
    }),
  )
  // return (ctx) => {
  //   const v = ctx.value.tags
  //   if (v && hasAtLeast(v, 1)) {
  //     ctx.append(v.join(', '))
  //   }
  //   return ctx
  // }
}

type IterableValue<T> = T extends Iterable<infer U> ? U : never

export function each<A extends PrintCtx<Iterable<any>>>(
  options:
    | Op<PrintCtx<IterableValue<A['value']>>>
    | JoinOptions<any> & {
      print: Op<PrintCtx<IterableValue<A['value']>>>
    },
): Op<A> {
  return (ctx) => {
    const { print, ...joinOptions } = isFunction(options) ? { print: options } : options
    const items = [] as CompositeGeneratorNode[]

    for (const value of ctx.value) {
      items.push(
        print(PrintCtx({ value })).out,
      )
    }

    if (isEmptyish(joinOptions)) {
      ctx.append(...items)
    } else {
      ctx.append(joinToNode(items, joinOptions))
    }

    return ctx
  }
}

export function indent<A extends AnyCtx>(...args: Ops<A> | [string]): Op<A> {
  if (args.length === 1 && typeof args[0] === 'string') {
    const text = dedent(args[0] as string)
    return (ctx: A) => {
      if (isEmptyish(text.trim())) {
        return ctx
      }
      ctx
        .indent({
          indentImmediately: false,
          indentedChildren: [
            NLEmpty,
            joinToNode(
              text.split('\n'),
              {
                separator: NL,
              },
            ),
            NLEmpty,
          ],
        })
      return ctx
    }
  }
  const ops = args as Ops<A>
  return (ctx: A) => {
    const nested = execOps(fresh(ctx), ops)
    if (nested.hasContent()) {
      ctx.indent({
        indentImmediately: false,
        indentedChildren: [
          NLEmpty,
          nested.out,
          NLEmpty,
        ],
      })
    }
    return ctx
  }
}

/**
 * Join multiple operations with newlines
 */
export function lines<A extends AnyCtx>(...ops: Ops<A>): Op<A> {
  return (ctx: A) => {
    // For each operation, create a fresh node
    const nested = pipe(
      ops,
      map((op) => op(fresh(ctx)).out),
      filter((n) => !n.isEmpty()),
    )
    ctx.appendIf(
      nested.length > 0,
      joinToNode(
        nested,
        {
          separator: NL,
        },
      ),
    )
    return ctx
  }
}

export function body<A extends AnyCtx>(...ops: Ops<A>): Op<A> {
  return piped(
    onenode(
      print('{'),
      indent(...ops),
      print('}'),
    ),
  )
}

/**
 * Append text to the current line, wrapped in single quotes
 * Multiple lines are joined with newlines
 * Escapes single quotes by doubling them
 */
const QUOTE = '\''
const ESCAPED_QUOTE = '\\' + QUOTE
export function inlineText<A extends PrintCtx<string>>(): Op<A>
export function inlineText(value: string): <A>(ctx: A) => A
export function inlineText(value?: string) {
  return (ctx: AnyCtx) => {
    let v = value ?? ctx.value
    if (isNullish(v) || !isString(v)) {
      return ctx
    }
    const escapedValue = v
      .replace(/(\r?\n|\t)+/g, ' ')
      .replaceAll(QUOTE, ESCAPED_QUOTE)
      .trim()
    ctx.append(`${QUOTE}${escapedValue}${QUOTE}`)
    return ctx
  }
}

function multilineText(value: string, quotes = DOUBLE_QUOTE) {
  return piped(
    print(quotes),
    indent(
      value.replaceAll(QUOTE, ESCAPED_QUOTE),
    ),
    print(quotes),
  )
}

/**
 * Append text to the current line, wrapped in single quotes
 *
 * Escapes single quotes by doubling them
 */
const DOUBLE_QUOTE = QUOTE.repeat(2)
export function text<A extends PrintCtx<string>>(): Op<A>
export function text(value: string): <A>(ctx: A) => A
export function text(value?: string) {
  return (ctx: AnyCtx) => {
    let v = value ?? ctx.value
    if (isNullish(v) || !isString(v)) {
      return ctx
    }
    if (v.includes('\n')) {
      return multilineText(v)(ctx)
    }
    return inlineText(v)(ctx)
  }
}

const TRIPLE_QUOTE = QUOTE.repeat(3)
export function markdown<A extends PrintCtx<string>>(): Op<A>
export function markdown(value: string): <A>(ctx: A) => A
export function markdown(value?: string) {
  return (ctx: AnyCtx) => {
    let v = value ?? ctx.value
    if (isNullish(v) || !isString(v)) {
      return ctx
    }
    return multilineText(v, TRIPLE_QUOTE)(ctx)
  }
}

export function markdownOrString<A extends PrintCtx<MarkdownOrString>>(): Op<A>
export function markdownOrString<A extends AnyCtx>(value: MarkdownOrString): Op<A>
export function markdownOrString(value?: MarkdownOrString) {
  return (ctx: AnyCtx) => {
    let v = value ?? ctx.value
    if (isNullish(v)) {
      return ctx
    }
    if ('md' in v) {
      return multilineText(v.md, TRIPLE_QUOTE)(ctx)
    }
    if ('txt' in v) {
      return multilineText(v.txt, DOUBLE_QUOTE)(ctx)
    }
    return ctx
  }
}

/**
 * Merge multiple operations into a single output node
 */
export function onenode<A extends AnyCtx>(...ops: Ops<A>): Op<A> {
  return (ctx: A) => {
    const result = execOps(fresh(ctx), ops)
    ctx.append(result.out)
    return ctx
  }
}

/**
 * Execute operations with spaces between them
 */
export function spacesBetween<A extends AnyCtx>(...ops: Ops<A>): Op<A> {
  return (ctx: A) => {
    // For each operation, create a fresh node
    const nested = pipe(
      ops,
      map((op) => op(fresh(ctx)).out),
      filter((n) => !n.isEmpty()),
    )
    ctx.appendIf(
      nested.length > 0,
      joinToNode(
        nested,
        {
          separator: ' ',
        },
      ),
    )
    return ctx
  }
}

export function when<A extends AnyCtx>(
  condition: (value: A['value']) => boolean,
  ...ops: Ops<NoInfer<A>>
): Op<A> {
  return (ctx: A) => {
    return condition(ctx.value) ? execOps(ctx, ops) : ctx
  }
}

export function select<A extends AnyCtx, B>(
  selector: (value: A['value']) => B,
  ...ops: Ops<PrintCtx<NonNullable<B>>>
): Op<A> {
  return (ctx) => {
    const value = selector(ctx.value)
    if (isNonNullish(value)) {
      const typedValue = value
      execOps(
        PrintCtx({ value: typedValue, out: ctx.out }),
        ops,
      )
    }
    return ctx
  }
}

export function stringProperty<
  A extends AnyCtx,
  PropName extends ConditionalKeys<A['value'], string | undefined | null>,
>(
  propertyName: PropName,
  propertyKeyword?: string,
): Op<A> {
  return select(
    e => e[propertyName] as string,
    spacesBetween(
      keyword(propertyKeyword ?? propertyName as string),
      text(),
    ),
  )
}

export function markdownProperty<
  A extends AnyCtx,
  PropName extends ConditionalKeys<A['value'], MarkdownOrString | undefined | null>,
>(
  propertyName: PropName,
  propertyKeyword?: string,
): Op<A> {
  return select(
    e => e[propertyName] as MarkdownOrString,
    spacesBetween(
      keyword(propertyKeyword ?? propertyName as string),
      markdownOrString(),
    ),
  )
}

export function element(): Op<PrintCtx<Element>> {
  return piped(
    spacesBetween(
      nameFromId(),
      eq(),
      kind(),
      title(),
      body(
        tags(),
        stringProperty('technology'),
        markdownProperty('summary'),
        markdownProperty('description'),
      ),
    ),
  )
}
