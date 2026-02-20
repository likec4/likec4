import { isString } from 'remeda'
import { type Assertion, describe, expect as viExpect, it } from 'vitest'
import {
  type Op,
  type Ops,
  body,
  eachOnFresh,
  eq,
  executeOnCtx,
  executeOnFresh,
  foreach,
  fresh,
  guard,
  indent,
  inlineText,
  lines,
  markdown,
  markdownOrString,
  materialize,
  merge,
  newline,
  print,
  property,
  select,
  separateNewLine,
  separateWith,
  spaceBetween,
  text,
  withctx,
} from './base'

/**
 * Returns expect function to execute operations on the given context
 */
function expectOnCtx<A>(ctx: A) {
  const exec = withctx(ctx)
  return (...ops: Ops<A>): Assertion<string> =>
    viExpect(
      materialize(exec(...ops)),
    )
}

function expectOp(...op: Op<any>[]): Assertion<string> {
  return expectOnCtx(undefined)(...op)
}

describe('text', () => {
  it('inlineText', () => {
    expectOp(inlineText('hello')).toBe('\'hello\'')
    expectOp(inlineText('hello\nworld')).toBe(`'hello world'`)
  })

  it('should print text with single quotes', () => {
    expectOp(text(`hello world`)).toBe(`'hello world'`)
  })

  it('should print text with single quotes and escaped quotes', () => {
    expectOp(text(`hello 'world'`)).toMatchInlineSnapshot(`"'hello \\'world\\''"`)
  })

  it('should print text with single quotes', () => {
    expectOp(text(`hello world`)).toBe(`'hello world'`)
  })

  it('should print multiline text with newline', () => {
    expectOp(
      text('hello\nworld'),
    ).toMatchInlineSnapshot(`
      "''
        hello
        world
      ''"
    `)
  })

  it('should print multiline text with newline and escaped quotes', () => {
    expectOp(
      text('hello\n\'this\'\nworld'),
    ).toMatchInlineSnapshot(`
      "''
        hello
        \\'this\\'
        world
      ''"
    `)
  })

  it('should print markdown', () => {
    expectOp(
      markdown('# Title\n\nThis is a **markdown** text'),
    ).toMatchInlineSnapshot(`
      "'''
        # Title

        This is a **markdown** text
      '''"
    `)
  })
})

describe('inline', () => {
  it('should separate with spaces', () => {
    expectOp(
      spaceBetween(
        print('id'),
        eq(),
        print('element'),
        text('oneline'),
        print('multiline'),
        text('hello\nworld'),
      ),
    ).toMatchInlineSnapshot(`
    "id = element 'oneline' multiline ''
      hello
      world
    ''"
  `)
  })
})

describe('lines', () => {
  const ops = [
    print('one'),
    print('two'),
    spaceBetween(
      print('three'),
      eq(),
      print('four'),
    ),
    print(), // must be skipped
    print('five'),
  ] as const satisfies Ops<string>

  it('should separate with newlines', () => {
    expectOp(
      lines(...ops),
    ).toMatchInlineSnapshot(`
      "one
      two
      three = four
      five"
    `)
  })

  it('should separate with given count of newlines', () => {
    expectOp(
      lines(1)(...ops),
    ).toMatchInlineSnapshot(`
      "one
      two
      three = four
      five"
    `)
  })

  it('should separate with given count of newlines', () => {
    expectOp(
      lines(2)(...ops),
    ).toMatchInlineSnapshot(`
      "one

      two

      three = four

      five"
    `)
  })
})

describe('context', () => {
  it('should execute operations on the context', () => {
    expectOnCtx('world')(
      spaceBetween(
        print('hello'),
        print(),
      ),
    ).toMatchInlineSnapshot(`"hello world"`)
  })

  it('should select property from context', () => {
    expectOp(
      withctx(
        {
          name: 'world',
        },
        spaceBetween(
          print('name'),
          eq(),
          property('name', text()),
        ),
      ),
    ).toMatchInlineSnapshot(`"name = 'world'"`)
  })

  it('should select deep property from context', () => {
    const expect = expectOnCtx({
      one: {
        two: {
          three: 'world',
        },
      },
    })
    expect(
      spaceBetween(
        print('name'),
        eq(),
        property(
          'one',
          property(
            'two',
            merge(
              property('three', text()),
              // @ts-expect-error property name does not exist
              property('thre2e', text()),
            ),
          ),
        ),
      ),
    ).toMatchInlineSnapshot(`"name = 'world'"`)
  })

  it('should execute forEach', () => {
    const expect = expectOnCtx(
      {
        items: [
          { name: 'one' },
          { name: 'two' },
          { name: 'three' },
        ],
      } as const,
    )
    expect(
      property(
        'items',
        foreach(
          spaceBetween(
            print('name'),
            eq(),
            property('name', text()),
          ),
          separateNewLine(),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "name = 'one'
      name = 'two'
      name = 'three'"
    `)
  })

  it('should allow select from context', () => {
    const expect = expectOnCtx({
      one: {
        two: {
          three: 'world',
        },
      },
    })
    expect(
      spaceBetween(
        print('name'),
        eq(),
        select(
          c => c.one.two,
          property('three', markdown()),
          // @ts-expect-error property name does not exist
          property('threre', markdown()),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "name = '''
        world
      '''"
    `)
  })

  it('should guard context', () => {
    const expect = expectOnCtx({
      one: {
        two: 'string' as string | Date,
      },
    })
    expect(
      select(
        c => c.one.two,
        guard(
          isString,
          spaceBetween(
            print('one.two'),
            eq(),
            text(),
          ),
        ),
      ),
    ).toMatchInlineSnapshot(`"one.two = 'string'"`)
  })
})

describe('fresh', () => {
  it('should create a context with the given value and empty output', () => {
    const ctx = fresh('hello')
    viExpect(ctx.ctx).toBe('hello')
    viExpect(ctx.out.isEmpty()).toBe(true)
  })

  it('should create a context with an object', () => {
    const ctx = fresh({ name: 'world' })
    viExpect(ctx.ctx).toEqual({ name: 'world' })
    viExpect(ctx.out.isEmpty()).toBe(true)
  })
})

describe('materialize', () => {
  it('should materialize context to string', () => {
    const ctx = fresh('hello')
    ctx.out.append('hello world')
    viExpect(materialize(ctx)).toBe('hello world')
  })

  it('should materialize an operation on a fresh context', () => {
    const result = materialize(print('hello'))
    viExpect(result).toBe('hello')
  })

  it('should use custom indentation', () => {
    const result = materialize(
      merge(
        print('root {'),
        indent(print('child')),
        print('}'),
      ),
      4,
    )
    viExpect(result).toMatchInlineSnapshot(`
      "root {
          child
      }"
    `)
  })
})

describe('executeOnCtx', () => {
  it('should execute operations sequentially on the same context', () => {
    const ctx = fresh(undefined)
    const result = executeOnCtx(ctx, [
      print('hello'),
      print(' '),
      print('world'),
    ])
    viExpect(materialize(result)).toBe('hello world')
  })

  it('should pass through context value', () => {
    const result = executeOnCtx(fresh('test'), [
      print(),
    ])
    viExpect(materialize(result)).toBe('test')
  })
})

describe('executeOnFresh', () => {
  it('should execute operations on a new output node', () => {
    const result = executeOnFresh('ctx-value', [
      print('output'),
    ])
    viExpect(result.ctx).toBe('ctx-value')
    viExpect(materialize(result)).toBe('output')
  })
})

describe('eachOnFresh', () => {
  it('should execute each operation on its own fresh context', () => {
    const results = eachOnFresh('hello', [
      print('one'),
      print('two'),
      print('three'),
    ])
    viExpect(results).toHaveLength(3)
    viExpect(materialize(results[0]!)).toBe('one')
    viExpect(materialize(results[1]!)).toBe('two')
    viExpect(materialize(results[2]!)).toBe('three')
  })
})

describe('print', () => {
  it('should print context value when no argument is given', () => {
    expectOnCtx('hello')(print()).toBe('hello')
  })

  it('should print a number context', () => {
    expectOnCtx(42)(print()).toBe('42')
  })

  it('should print a boolean context', () => {
    expectOnCtx(true)(print()).toBe('true')
  })

  it('should print using a format function', () => {
    expectOnCtx('world')(
      print(v => `hello ${v}`),
    ).toBe('hello world')
  })

  it('should skip nullish values', () => {
    expectOnCtx(null as any)(print()).toBe('')
    expectOnCtx(undefined as any)(print()).toBe('')
  })

  it('should throw on non-primitive values', () => {
    viExpect(() =>
      materialize(
        // @ts-ignore
        withctx({ obj: true }, print()),
      )
    ).toThrow('Value must be a string, number or boolean')
  })
})

describe('newline', () => {
  it('should append a newline', () => {
    expectOp(
      merge(print('a'), newline(), print('b')),
    ).toMatchInlineSnapshot(`
      "a
      b"
    `)
  })

  it('should append newline only if not empty with ifNotEmpty', () => {
    expectOp(
      merge(newline('ifNotEmpty'), print('hello')),
    ).toBe('hello')
  })

  it('should append newline when content exists with ifNotEmpty', () => {
    expectOp(
      merge(print('a'), newline('ifNotEmpty'), print('b')),
    ).toMatchInlineSnapshot(`
      "a
      b"
    `)
  })
})

describe('merge', () => {
  it('should merge multiple operations into single output', () => {
    expectOp(
      merge(print('hello'), print(' '), print('world')),
    ).toBe('hello world')
  })

  it('should skip empty output from operations', () => {
    expectOp(
      merge(print('hello'), merge(), print(' world')),
    ).toBe('hello world')
  })
})

describe('indent', () => {
  it('should indent a string', () => {
    expectOp(
      merge(
        print('parent {'),
        indent('child'),
        print('}'),
      ),
    ).toMatchInlineSnapshot(`
      "parent {
        child
      }"
    `)
  })

  it('should indent multiline string', () => {
    expectOp(
      merge(
        print('parent {'),
        indent('line1\nline2\nline3'),
        print('}'),
      ),
    ).toMatchInlineSnapshot(`
      "parent {
        line1
        line2
        line3
      }"
    `)
  })

  it('should skip empty string', () => {
    expectOp(
      merge(
        print('parent'),
        indent('  '),
      ),
    ).toBe('parent')
  })

  it('should indent operations', () => {
    expectOp(
      merge(
        print('parent {'),
        indent(
          print('child1'),
          newline(),
          print('child2'),
        ),
        print('}'),
      ),
    ).toMatchInlineSnapshot(`
      "parent {
        child1
        child2
      }"
    `)
  })

  it('should skip indent when operations produce no content', () => {
    expectOp(
      merge(
        print('parent'),
        indent(merge()),
      ),
    ).toBe('parent')
  })
})

describe('body', () => {
  it('should wrap operations in braces', () => {
    expectOp(
      body(
        print('child'),
      ),
    ).toMatchInlineSnapshot(`
      "{
        child
      }"
    `)
  })

  it('should wrap with keyword prefix', () => {
    expectOp(
      body('element')(
        print('name = test'),
      ),
    ).toMatchInlineSnapshot(`
      "element {
        name = test
      }"
    `)
  })

  it('should wrap multiple lines in body', () => {
    expectOp(
      body('model')(
        print('line1'),
        print('line2'),
      ),
    ).toMatchInlineSnapshot(`
      "model {
        line1
        line2
      }"
    `)
  })
})

describe('inlineText', () => {
  it('should use context value when no argument given', () => {
    expectOnCtx('hello')(inlineText()).toBe('\'hello\'')
  })

  it('should collapse tabs and newlines into spaces', () => {
    expectOp(inlineText('hello\t\nworld')).toBe('\'hello world\'')
  })

  it('should skip nullish context', () => {
    expectOnCtx(null as any)(inlineText()).toBe('')
  })

  it('should skip non-string context', () => {
    expectOnCtx(42 as any)(inlineText()).toBe('')
  })
})

describe('text', () => {
  it('should use context value when no argument given', () => {
    expectOnCtx('hello')(text()).toBe('\'hello\'')
  })

  it('should accept a format function', () => {
    expectOnCtx('world')(
      text(v => `hello ${v}`),
    ).toBe('\'hello world\'')
  })

  it('should skip nullish values', () => {
    expectOnCtx(null as any)(text()).toBe('')
  })

  it('should skip non-string values', () => {
    expectOnCtx(42 as any)(text()).toBe('')
  })
})

describe('markdown', () => {
  it('should use context value when no argument given', () => {
    expectOnCtx('hello')(markdown()).toMatchInlineSnapshot(`
      "'''
        hello
      '''"
    `)
  })

  it('should skip nullish context', () => {
    expectOnCtx(null as any)(markdown()).toBe('')
  })
})

describe('markdownOrString', () => {
  it('should print markdown variant', () => {
    expectOp(
      markdownOrString({ md: '# Title\n\nBody' }),
    ).toMatchInlineSnapshot(`
      "'''
        # Title

        Body
      '''"
    `)
  })

  it('should print txt variant', () => {
    expectOp(
      markdownOrString({ txt: 'hello\nworld' }),
    ).toMatchInlineSnapshot(`
      "''
        hello
        world
      ''"
    `)
  })

  it('should use context value when no argument given', () => {
    expectOnCtx({ md: 'hello' } as { md: string })(
      markdownOrString(),
    ).toMatchInlineSnapshot(`
      "'''
        hello
      '''"
    `)
  })

  it('should skip nullish value', () => {
    expectOnCtx(null as any)(markdownOrString()).toBe('')
  })
})

describe('separateWith', () => {
  it('should return join options with separator', () => {
    const expect = expectOnCtx(
      {
        items: ['a', 'b', 'c'],
      } as const,
    )
    expect(
      property(
        'items',
        foreach(
          print(),
          separateWith(', '),
        ),
      ),
    ).toBe('a, b, c')
  })
})

describe('separateNewLine', () => {
  it('should return join options with newline separator', () => {
    const expect = expectOnCtx(
      {
        items: ['a', 'b', 'c'],
      } as const,
    )
    expect(
      property(
        'items',
        foreach(
          print(),
          separateNewLine(),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "a
      b
      c"
    `)
  })
})

describe('foreach', () => {
  it('should execute single op on each item', () => {
    expectOnCtx(['a', 'b', 'c'] as const)(
      foreach(print()),
    ).toBe('abc')
  })

  it('should execute multiple ops on each item', () => {
    expectOnCtx(['a', 'b', 'c'] as const)(
      foreach(
        print(),
        print('-'),
      ),
    ).toBe('a-b-c-')
  })

  it('should filter empty items with join options', () => {
    const items = [
      { name: 'one' },
      { name: null as string | null },
      { name: 'three' },
    ]
    expectOnCtx(items)(
      foreach(
        property('name', print()),
        separateWith(', '),
      ),
    ).toBe('one, three')
  })
})

describe('guard', () => {
  it('should skip when condition is false', () => {
    expectOnCtx(42 as string | number)(
      guard(isString, text()),
    ).toBe('')
  })
})

describe('select', () => {
  it('should skip when selector returns null', () => {
    expectOnCtx({ a: null as string | null })(
      select(c => c.a, text()),
    ).toBe('')
  })
})

describe('withctx', () => {
  it('should forward context with single-arg curried form', () => {
    const forward = withctx('hello')
    expectOp(
      forward(print()),
    ).toBe('hello')
  })

  it('should forward context with multi-arg form', () => {
    expectOp(
      withctx('hello', print()),
    ).toBe('hello')
  })
})

// const model = Builder
//   .specification({
//     elements: {
//       actor: {},
//       system: {},
//       component: {},
//     },
//     deployments: {
//       env: {},
//       vm: {},
//     },
//     relationships: {
//       like: {},
//       dislike: {},
//     },
//     tags: {
//       tag1: {},
//       tag2: {},
//     },
//     metadataKeys: ['key1', 'key2'],
//   })
//   .model(({ actor, system, component, relTo }, _) =>
//     _(
//       actor('alice'),
//       actor('bob', {
//         title: 'Bob',
//         tags: ['tag1', 'tag2' as const],
//       }),
//       system('cloud').with(
//         component('backend').with(
//           component('api', {
//             title: 'API Services',
//           }),
//           component('db'),
//         ),
//         component('frontend'),
//       ),
//     )
//   )
//   .deployment(({ env, vm, instanceOf }, _) =>
//     _(
//       env('prod').with(
//         vm('vm1'),
//         vm('vm2'),
//       ),
//       env('dev').with(
//         vm('vm1'),
//         instanceOf('cloud.backend.api'),
//       ),
//     )
//   )
//   // Test Element View
//   .views(({ view, $include }, _) =>
//     _(
//       // rules inside
//       view('view1', $include('cloud.backend')),
//       view('view2', $include('cloud.backend')),
//     )
//   )
//   .build()

// describe('context', () => {
//   function expect(...ops: PrintOp<typeof model>[]): Assertion<string> {
//     const result = reduce(ops, (ctx, op) => op(ctx), PrintCtx({ value: model }))
//     return viExpect(
//       result.toString(),
//     )
//   }

//   it('inherits out from parent', () => {
//     expect(
//       print('model '),
//       body(
//         select(
//           c => values(c.elements),
//           each({
//             separator: NL,
//             suffix(element, index, isLast) {
//               if (!isLast) {
//                 return NL
//               }
//             },
//             print: element(),
//           }),
//         ),
//       ),
//     ).toMatchInlineSnapshot(`
//       "model {
//         alice = actor 'alice' {}

//         bob = actor 'Bob' {
//           #tag1, #tag2
//         }

//         cloud = system 'cloud' {}

//         backend = component 'backend' {}

//         api = component 'API Services' {}

//         db = component 'db' {}

//         frontend = component 'frontend' {}
//       }"
//     `)
//   })
// })
